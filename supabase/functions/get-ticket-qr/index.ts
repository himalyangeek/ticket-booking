import { adminClient, requireUser } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { signClaims } from '../_shared/qr.ts'
import { z } from 'npm:zod@4'

const requestSchema = z.object({ ticketId: z.string().uuid() })

const CURRENT_KEY_ID = Deno.env.get('SIGNING_KEY_ID') ?? 'key-2026-01'
const PRIVATE_KEY = Deno.env.get('ED25519_PRIVATE_KEY')!

// The QR payload (claims + signature) isn't persisted anywhere — it's re-derived
// on demand from the ticket's own authoritative columns and re-signed with the
// current key. A fresh nonce each call is fine: nonce only adds entropy to the
// signed string, it isn't checked against a stored value anywhere.
Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const user = await requireUser(req)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

  const body = requestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), { status: 400, headers })
  }
  const { ticketId } = body.data

  const admin = adminClient()
  const { data: ticket, error } = await admin.from('tickets').select('*').eq('id', ticketId).single()
  if (error || !ticket) {
    return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers })
  }
  if (ticket.user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers })
  }

  const claims = {
    v: 1 as const,
    kid: CURRENT_KEY_ID,
    tid: ticket.id,
    uid: ticket.user_id,
    pid: ticket.program_id,
    ts: ticket.issued_at,
    exp: ticket.expires_at,
    p: ticket.passenger_count,
    nonce: crypto.randomUUID(),
  }
  const sig = await signClaims(claims, PRIVATE_KEY)

  return new Response(JSON.stringify({ qr: { ...claims, sig } }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
