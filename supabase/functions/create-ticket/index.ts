import { adminClient } from '../_shared/supabaseAdmin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { bookingRequestSchema } from '../_shared/validation.ts'
import { randomNonce, signClaims } from '../_shared/qr.ts'
import { hashAadhaar } from '../_shared/aadhaar.ts'

const CURRENT_KEY_ID = Deno.env.get('SIGNING_KEY_ID') ?? 'key-2026-01'
const PRIVATE_KEY = Deno.env.get('ED25519_PRIVATE_KEY')!
const TICKET_VALID_HOURS = 8

// Public booking endpoint — visitors don't have accounts, so anyone can call this.
// Payment is mocked for now: it always "succeeds" the moment the visitor confirms.
Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const body = bookingRequestSchema.safeParse(await req.json().catch(() => null))
  if (!body.success) {
    return new Response(JSON.stringify({ error: body.error.message }), { status: 400, headers })
  }
  const { programId, slotId, passengerCount, bookerName, bookerMobile, aadhaarNumber } = body.data

  const admin = adminClient()

  const { data: program, error: programError } = await admin
    .from('programs')
    .select('id, price')
    .eq('id', programId)
    .single()
  if (programError || !program) {
    return new Response(JSON.stringify({ error: 'Program not found' }), { status: 404, headers })
  }

  const { data: slot, error: slotError } = await admin
    .from('program_slots')
    .select('id, program_id, starts_at, ends_at, available_capacity')
    .eq('id', slotId)
    .eq('program_id', programId)
    .single()
  if (slotError || !slot) {
    return new Response(JSON.stringify({ error: 'Slot not found' }), { status: 404, headers })
  }

  // Atomically reserve capacity: only succeeds if enough seats are still available,
  // preventing a race between two concurrent bookings from overselling the slot.
  const { data: reserved, error: reserveError } = await admin
    .from('program_slots')
    .update({ available_capacity: slot.available_capacity - passengerCount })
    .eq('id', slotId)
    .gte('available_capacity', passengerCount)
    .select()
    .single()
  if (reserveError || !reserved) {
    return new Response(JSON.stringify({ error: 'Not enough capacity left in this slot' }), {
      status: 409,
      headers,
    })
  }

  const amount = Number(program.price) * passengerCount
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const issuedAt = new Date()
  const expiresAt = new Date(slot.ends_at)
  if (expiresAt.getTime() < issuedAt.getTime() + TICKET_VALID_HOURS * 60 * 60 * 1000) {
    expiresAt.setTime(issuedAt.getTime() + TICKET_VALID_HOURS * 60 * 60 * 1000)
  }

  const { last4, hash } = await hashAadhaar(aadhaarNumber)

  // Mock payment gateway: this is the single place a real gateway integration
  // (Razorpay/PayU) would slot in later — verify payment, then proceed.
  const paymentReference = `MOCK-${crypto.randomUUID()}`

  const { data: ticket, error: ticketError } = await admin
    .from('tickets')
    .insert({
      ticket_number: ticketNumber,
      program_id: programId,
      slot_id: slotId,
      passenger_count: passengerCount,
      amount,
      booker_name: bookerName,
      booker_mobile: bookerMobile,
      aadhaar_last4: last4,
      aadhaar_hash: hash,
      visit_date: slot.starts_at.slice(0, 10),
      payment_status: 'PAID',
      payment_reference: paymentReference,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (ticketError || !ticket) {
    // Roll back the capacity reservation since ticket creation failed.
    await admin
      .from('program_slots')
      .update({ available_capacity: reserved.available_capacity + passengerCount })
      .eq('id', slotId)
    return new Response(JSON.stringify({ error: 'Failed to create ticket' }), { status: 500, headers })
  }

  const claims = {
    v: 1 as const,
    kid: CURRENT_KEY_ID,
    tid: ticket.id,
    pid: programId,
    ts: issuedAt.toISOString(),
    exp: expiresAt.toISOString(),
    p: passengerCount,
    nonce: randomNonce(),
  }
  const sig = await signClaims(claims, PRIVATE_KEY)

  return new Response(JSON.stringify({ qr: { ...claims, sig }, ticket }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
})
