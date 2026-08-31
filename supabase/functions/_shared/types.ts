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
  aadhaar_hash: string
  visit_date: string
  payment_status: 'PENDING' | 'PAID' | 'FAILED'
  payment_reference: string | null
  status: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED'
  issued_at: string
  expires_at: string
  consumed_at: string | null
  created_at: string
}
