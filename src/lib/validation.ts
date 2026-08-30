import { z } from 'zod'

export const qrPayloadSchema = z.object({
  v: z.literal(1),
  kid: z.string().min(1),
  tid: z.string().uuid(),
  uid: z.string().uuid(),
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

export const bookingSchema = z.object({
  programId: z.string().uuid(),
  slotId: z.string().uuid(),
  passengerCount: z.number().int().min(1).max(20),
})

export type BookingInput = z.infer<typeof bookingSchema>
