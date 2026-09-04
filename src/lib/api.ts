import { supabase } from './supabase'
import type { BookingInput, FindTicketInput } from './validation'
import type { Program, ProgramSlot, QrPayload, ScanOutcome, Ticket, TicketWithJoins } from '../types/ticket'

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

export function findTicket(input: FindTicketInput) {
  return invoke<{ ticket: TicketWithJoins; qr: QrPayload }>('find-ticket', input)
}

export async function listPrograms() {
  const { data, error } = await supabase.from('programs').select('*').order('forest_range')
  if (error) throw error
  return data as Program[]
}

export async function listSlotsForDate(programId: string, date: string) {
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`
  const { data, error } = await supabase
    .from('program_slots')
    .select('*')
    .eq('program_id', programId)
    .gte('starts_at', startOfDay)
    .lte('starts_at', endOfDay)
    .gt('available_capacity', 0)
    .order('starts_at')
  if (error) throw error
  return data as ProgramSlot[]
}

export interface ProgramInput {
  name: string
  description: string | null
  price: number
  forest_range: string
  highlight_animals: string[]
  animal_emoji: string
}

export type ProgramWithSlots = Program & { program_slots: ProgramSlot[] }

export async function adminListProgramsWithSlots() {
  const { data, error } = await supabase
    .from('programs')
    .select('*, program_slots(*)')
    .order('forest_range')
  if (error) throw error
  return data as ProgramWithSlots[]
}

export async function adminCreateProgram(input: ProgramInput) {
  const { data, error } = await supabase.from('programs').insert(input).select().single()
  if (error) throw error
  return data as Program
}

export async function adminUpdateProgram(id: string, input: Partial<ProgramInput>) {
  const { data, error } = await supabase.from('programs').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as Program
}

export async function adminDeleteProgram(id: string) {
  const { error } = await supabase.from('programs').delete().eq('id', id)
  if (error) throw error
}

export interface SlotInput {
  program_id: string
  starts_at: string
  ends_at: string
  capacity: number
  available_capacity: number
  session_label: string
}

export async function adminCreateSlot(input: SlotInput) {
  const { data, error } = await supabase.from('program_slots').insert(input).select().single()
  if (error) throw error
  return data as ProgramSlot
}

export async function adminUpdateSlot(id: string, input: Partial<SlotInput>) {
  const { data, error } = await supabase.from('program_slots').update(input).eq('id', id).select().single()
  if (error) throw error
  return data as ProgramSlot
}

export async function adminDeleteSlot(id: string) {
  const { error } = await supabase.from('program_slots').delete().eq('id', id)
  if (error) throw error
}

export interface AdminTicketFilters {
  from?: string
  to?: string
}

const ADMIN_TICKET_SELECT = '*, programs(name, forest_range), program_slots(starts_at, ends_at, session_label)'

export async function listAdminTickets(filters: AdminTicketFilters) {
  let query = supabase.from('tickets').select(ADMIN_TICKET_SELECT).order('created_at', { ascending: false })
  if (filters.from) query = query.gte('visit_date', filters.from)
  if (filters.to) query = query.lte('visit_date', filters.to)
  const { data, error } = await query
  if (error) throw error
  return data
}
