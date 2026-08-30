import { adminClient, requireUser } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { consumeRequestSchema } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const scanner = await requireUser(req)
  if (!scanner) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

  const admin = adminClient()

  const { data: scannerProfile } = await admin
    .from('profiles')
    .select('is_scanner')
    .eq('id', scanner.id)
    .single()
  if (!scannerProfile?.is_scanner) {
    return new Response(JSON.stringify({ error: 'Not authorized to scan tickets' }), { status: 403, headers })
  }

  const body = consumeRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), { status: 400, headers })
  }
  const { ticketId } = body.data

  // Single conditional UPDATE — the DB row lock makes this safe against two scanners
  // hitting the same ticket at the same instant. Whichever request's WHERE clause
  // still matches "wins"; the other gets zero rows back.
  const { data: consumed, error } = await admin
    .from('tickets')
    .update({ status: 'USED', consumed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .select()
    .maybeSingle()

  if (error) {
    return new Response(JSON.stringify({ error: 'Consumption failed' }), { status: 500, headers })
  }

  if (!consumed) {
    const { data: current } = await admin.from('tickets').select('*').eq('id', ticketId).maybeSingle()
    const reason = !current
      ? 'Ticket not found'
      : current.status !== 'ACTIVE'
        ? `Ticket already ${current.status}`
        : 'Ticket expired'
    await admin
      .from('ticket_scan_events')
      .insert({ ticket_id: ticketId, scanner_user_id: scanner.id, result: 'INVALID', reason })
    return new Response(JSON.stringify({ result: 'INVALID', reason, ticket: current ?? undefined }), { headers })
  }

  await admin.from('ticket_scan_events').insert({
    ticket_id: consumed.id,
    scanner_user_id: scanner.id,
    result: 'VALID',
    reason: 'Consumed',
  })

  return new Response(JSON.stringify({ result: 'VALID', ticket: consumed }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
