export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface Program {
  id: string
  name: string
  description: string | null
  price: number
  forest_range: string
  highlight_animals: string[]
  animal_emoji: string
  created_at: string
}

export interface ProgramSlot {
  id: string
  program_id: string
  starts_at: string
  ends_at: string
  capacity: number
  available_capacity: number
  session_label: string
  created_at: string
}

export interface Ticket {
  id: string
  ticket_number: string
  program_id: string
  slot_id: string
  passenger_count: number
  amount: number
  booker_name: string
  booker_mobile: string
  aadhaar_last4: string
  visit_date: string
  payment_status: PaymentStatus
  payment_reference: string | null
  status: TicketStatus
  issued_at: string
  expires_at: string
  consumed_at: string | null
  created_at: string
}

export interface QrPayload {
  v: 1
  kid: string
  tid: string
  pid: string
  ts: string
  exp: string
  p: number
  nonce: string
  sig: string
}

export type ScanResult = 'VALID' | 'INVALID'

export interface ScanOutcome {
  result: ScanResult
  reason?: string
  ticket?: Ticket
}
