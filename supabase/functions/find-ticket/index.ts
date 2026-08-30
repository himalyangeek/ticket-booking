import { adminClient } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { findTicketRequestSchema } from '../_shared/validation.ts'
import { signClaims } from '../_shared/qr.ts'

const CURRENT_KEY_ID = Deno.env.get('SIGNING_KEY_ID') ?? 'key-2026-01'
const PRIVATE_KEY = Deno.env.get('ED25519_PRIVATE_KEY')!

// Public ticket lookup — there are no visitor accounts, so a ticket is retrieved by
// proving you know BOTH the ticket number and the booking mobile number (not just a
// guessable UUID). The QR isn't persisted anywhere; it's re-derived on demand from
// the ticket's own authoritative columns and re-signed with the current key.
Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const body = findTicketRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), { status: 400, headers })
  }
  const { ticketNumber, mobile } = body.data

  const admin = adminClient()
  const { data: ticket, error } = await admin
    .from('tickets')
    .select('*, programs(name, forest_range), program_slots(starts_at, ends_at, session_label)')
    .eq('ticket_number', ticketNumber)
    .eq('booker_mobile', mobile)
    .maybeSingle()

  if (error || !ticket) {
    return new Response(JSON.stringify({ error: 'No ticket found for that number and mobile number' }), {
      status: 404,
      headers,
    })
  }

  const claims = {
    v: 1 as const,
    kid: CURRENT_KEY_ID,
    tid: ticket.id,
    pid: ticket.program_id,
    ts: ticket.issued_at,
    exp: ticket.expires_at,
    p: ticket.passenger_count,
    nonce: crypto.randomUUID(),
  }
  const sig = await signClaims(claims, PRIVATE_KEY)

  return new Response(JSON.stringify({ ticket, qr: { ...claims, sig } }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
