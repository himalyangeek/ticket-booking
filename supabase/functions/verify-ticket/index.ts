import { adminClient, requireUser, runInBackground } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyRequestSchema } from '../_shared/validation.ts'
import { verifySignature } from '../_shared/qr.ts'
import type { Ticket } from '../_shared/types.ts'

// Maps key id -> base64url-encoded Ed25519 public key, e.g. {"key-2026-01":"...","key-2026-02":"..."}.
// Old keys stay here until every ticket signed with them has expired, so rotation
// never invalidates tickets already in circulation.
const PUBLIC_KEYS: Record<string, string> = JSON.parse(Deno.env.get('ED25519_PUBLIC_KEYS') ?? '{}')

function logScan(
  admin: ReturnType<typeof adminClient>,
  ticketId: string | null,
  scannerUserId: string,
  result: 'VALID' | 'INVALID',
  reason?: string,
) {
  return admin.from('ticket_scan_events').insert({ ticket_id: ticketId, scanner_user_id: scannerUserId, result, reason })
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const scanner = requireUser(req)
  if (!scanner) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })
  const scannerId = scanner.id

  const admin = adminClient()

  // Authorization only needs the caller's id, so it's fired off immediately and
  // awaited alongside the ticket lookup below rather than blocking in front of
  // the QR parsing/signature check — that overlap is what keeps a scan fast
  // under a long gate queue instead of paying for each round trip in sequence.
  const rolePromise = admin.from('profiles').select('role').eq('id', scannerId).single()

  const body = verifyRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    const { data: scannerProfile } = await rolePromise
    if (scannerProfile?.role !== 'ADMIN' && scannerProfile?.role !== 'TICKET_CHECKER') {
      return new Response(JSON.stringify({ error: 'Not authorized to scan tickets' }), { status: 403, headers })
    }
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Malformed QR payload' }), { headers })
  }
  const { sig, ...claims } = body.data.qr

  const publicKey = PUBLIC_KEYS[claims.kid]
  const signatureValid = publicKey ? await verifySignature(claims, sig, publicKey) : false
  const ticketPromise = admin.from('tickets').select('*').eq('id', claims.tid).single()

  const [{ data: scannerProfile }, { data: ticket, error: ticketError }] = await Promise.all([rolePromise, ticketPromise])

  if (scannerProfile?.role !== 'ADMIN' && scannerProfile?.role !== 'TICKET_CHECKER') {
    return new Response(JSON.stringify({ error: 'Not authorized to scan tickets' }), { status: 403, headers })
  }

  function fail(reason: string, ticketRow?: Ticket) {
    runInBackground(logScan(admin, claims.tid, scannerId, 'INVALID', reason))
    return new Response(JSON.stringify({ result: 'INVALID', reason, ticket: ticketRow }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  if (!publicKey) return fail('Unknown signing key')
  if (!signatureValid) return fail('Invalid signature')
  if (ticketError || !ticket) return fail('Ticket not found')

  // Never trust the QR's own claims for these fields — only the database is authoritative.
  if (ticket.program_id !== claims.pid) return fail('Ticket claims do not match records', ticket)
  if (ticket.status !== 'ACTIVE') return fail(`Ticket already ${ticket.status}`, ticket)
  if (new Date(ticket.expires_at).getTime() <= Date.now()) return fail('Ticket expired', ticket)

  runInBackground(logScan(admin, ticket.id, scannerId, 'VALID', 'Passed verification, pending consumption'))
  return new Response(JSON.stringify({ result: 'VALID', ticket }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
