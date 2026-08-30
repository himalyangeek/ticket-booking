import { z } from 'npm:zod@4'

export const bookingRequestSchema = z.object({
  programId: z.string().uuid(),
  slotId: z.string().uuid(),
  passengerCount: z.number().int().min(1).max(20),
})

export const qrClaimsSchema = z.object({
  v: z.literal(1),
  kid: z.string().min(1),
  tid: z.string().uuid(),
  uid: z.string().uuid(),
  pid: z.string().uuid(),
  ts: z.string().datetime({ offset: true }),
  exp: z.string().datetime({ offset: true }),
  p: z.number().int().positive(),
  nonce: z.string().min(1),
})

export const verifyRequestSchema = z.object({
  qr: qrClaimsSchema.extend({ sig: z.string().min(1) }),
})

export const consumeRequestSchema = z.object({
  ticketId: z.string().uuid(),
})
