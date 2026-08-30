import { z } from 'npm:zod@4'

export const bookingRequestSchema = z.object({
  programId: z.string().uuid(),
  slotId: z.string().uuid(),
  passengerCount: z.number().int().min(1).max(20),
  bookerName: z.string().trim().min(1).max(100),
  bookerMobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
})

export const qrClaimsSchema = z.object({
  v: z.literal(1),
  kid: z.string().min(1),
  tid: z.string().uuid(),
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

export const findTicketRequestSchema = z.object({
  ticketNumber: z.string().min(1),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
})
