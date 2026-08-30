import { adminClient, requireUser } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyRequestSchema } from '../_shared/validation.ts'
import { verifySignature } from '../_shared/qr.ts'

// Maps key id -> base64url-encoded Ed25519 public key, e.g. {"key-2026-01":"...","key-2026-02":"..."}.
// Old keys stay here until every ticket signed with them has expired, so rotation
// never invalidates tickets already in circulation.
const PUBLIC_KEYS: Record<string, string> = JSON.parse(Deno.env.get('ED25519_PUBLIC_KEYS') ?? '{}')

async function logScan(
  admin: ReturnType<typeof adminClient>,
  ticketId: string | null,
  scannerUserId: string,
  result: 'VALID' | 'INVALID',
  reason?: string,
) {
  await admin
    .from('ticket_scan_events')
    .insert({ ticket_id: ticketId, scanner_user_id: scannerUserId, result, reason })
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const scanner = await requireUser(req)
  if (!scanner) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

  const admin = adminClient()

  const { data: scannerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', scanner.id)
    .single()
  // Both designations can scan — ADMIN can additionally view the full dashboard.
  if (scannerProfile?.role !== 'ADMIN' && scannerProfile?.role !== 'TICKET_CHECKER') {
    return new Response(JSON.stringify({ error: 'Not authorized to scan tickets' }), { status: 403, headers })
  }

  const body = verifyRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Malformed QR payload' }), { headers })
  }
  const { sig, ...claims } = body.data.qr

  const publicKey = PUBLIC_KEYS[claims.kid]
  if (!publicKey) {
    await logScan(admin, claims.tid, scanner.id, 'INVALID', 'Unknown key id')
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Unknown signing key' }), { headers })
  }

  const signatureValid = await verifySignature(claims, sig, publicKey)
  if (!signatureValid) {
    await logScan(admin, claims.tid, scanner.id, 'INVALID', 'Signature verification failed')
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Invalid signature' }), { headers })
  }

  const { data: ticket, error } = await admin.from('tickets').select('*').eq('id', claims.tid).single()
  if (error || !ticket) {
    await logScan(admin, claims.tid, scanner.id, 'INVALID', 'Ticket not found')
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Ticket not found' }), { headers })
  }

  // Never trust the QR's own claims for these fields — only the database is authoritative.
  if (ticket.program_id !== claims.pid) {
    await logScan(admin, ticket.id, scanner.id, 'INVALID', 'Claims do not match database record')
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Ticket claims do not match records' }), {
      headers,
    })
  }

  if (ticket.status !== 'ACTIVE') {
    await logScan(admin, ticket.id, scanner.id, 'INVALID', `Ticket status is ${ticket.status}`)
    return new Response(JSON.stringify({ result: 'INVALID', reason: `Ticket already ${ticket.status}`, ticket }), {
      headers,
    })
  }

  if (new Date(ticket.expires_at).getTime() <= Date.now()) {
    await logScan(admin, ticket.id, scanner.id, 'INVALID', 'Ticket expired')
    return new Response(JSON.stringify({ result: 'INVALID', reason: 'Ticket expired', ticket }), { headers })
  }

  await logScan(admin, ticket.id, scanner.id, 'VALID', 'Passed verification, pending consumption')
  return new Response(JSON.stringify({ result: 'VALID', ticket }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
