export type TicketStatus = 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED'

export interface Program {
  id: string
  name: string
  description: string | null
  price: number
  created_at: string
}

export interface ProgramSlot {
  id: string
  program_id: string
  starts_at: string
  ends_at: string
  capacity: number
  available_capacity: number
  created_at: string
}

export interface Ticket {
  id: string
  ticket_number: string
  user_id: string
  program_id: string
  slot_id: string
  passenger_count: number
  amount: number
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
  uid: string
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
