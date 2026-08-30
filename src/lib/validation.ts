import { z } from 'zod'

export const qrPayloadSchema = z.object({
  v: z.literal(1),
  kid: z.string().min(1),
  tid: z.string().uuid(),
  pid: z.string().uuid(),
  ts: z.string().datetime({ offset: true }),
  exp: z.string().datetime({ offset: true }),
  p: z.number().int().positive(),
  nonce: z.string().min(1),
  sig: z.string().min(1),
})

export type QrPayloadInput = z.infer<typeof qrPayloadSchema>

export function parseQrPayload(raw: string) {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { success: false as const, error: 'Not valid JSON' }
  }

  const result = qrPayloadSchema.safeParse(json)
  if (!result.success) {
    return { success: false as const, error: result.error.message }
  }

  return { success: true as const, data: result.data }
}

export const bookerNameSchema = z.string().trim().min(1, 'Name is required')
export const bookerMobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
export const aadhaarNumberSchema = z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits')

export const bookingSchema = z.object({
  programId: z.string().uuid(),
  slotId: z.string().uuid(),
  passengerCount: z.number().int().min(1).max(20),
  bookerName: bookerNameSchema,
  bookerMobile: bookerMobileSchema,
  aadhaarNumber: aadhaarNumberSchema,
})

export type BookingInput = z.infer<typeof bookingSchema>

export const findTicketSchema = z.object({
  ticketNumber: z.string().min(1, 'Ticket number is required'),
  mobile: bookerMobileSchema,
})

export type FindTicketInput = z.infer<typeof findTicketSchema>
