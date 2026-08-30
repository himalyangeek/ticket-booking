import { supabase } from './supabase'
import type { BookingInput } from './validation'
import type { QrPayload, ScanOutcome, Ticket } from '../types/ticket'

async function invoke<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body })
  if (error) throw error
  return data as T
}

export function createTicket(input: BookingInput) {
  return invoke<{ qr: QrPayload; ticket: Ticket }>('create-ticket', input)
}

export function verifyTicket(qr: QrPayload) {
  return invoke<ScanOutcome>('verify-ticket', { qr })
}

export function consumeTicket(ticketId: string) {
  return invoke<ScanOutcome>('consume-ticket', { ticketId })
}

export function getTicketQr(ticketId: string) {
  return invoke<{ qr: QrPayload }>('get-ticket-qr', { ticketId })
}

const TICKET_SELECT = '*, programs(name, price), program_slots(starts_at, ends_at)'

export async function listMyTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTicket(ticketId: string) {
  const { data, error } = await supabase.from('tickets').select(TICKET_SELECT).eq('id', ticketId).single()
  if (error) throw error
  return data
}

export async function listPrograms() {
  const { data, error } = await supabase.from('programs').select('*').order('name')
  if (error) throw error
  return data
}

export async function listSlots(programId: string) {
  const { data, error } = await supabase
    .from('program_slots')
    .select('*')
    .eq('program_id', programId)
    .gt('available_capacity', 0)
    .order('starts_at')
  if (error) throw error
  return data
}
