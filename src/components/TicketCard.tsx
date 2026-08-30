import { Link } from 'react-router-dom'
import type { Ticket, TicketStatus } from '../types/ticket'

type TicketWithJoins = Ticket & {
  programs: { name: string; price: number } | null
  program_slots: { starts_at: string; ends_at: string } | null
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  USED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-yellow-100 text-yellow-700',
}

export function TicketCard({ ticket }: { ticket: TicketWithJoins }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="flex items-center justify-between rounded border p-4 hover:bg-gray-50"
    >
      <div className="text-left">
        <p className="font-medium">{ticket.programs?.name ?? 'Program'}</p>
        <p className="text-sm text-gray-500">
          {ticket.program_slots ? new Date(ticket.program_slots.starts_at).toLocaleString() : ''} ·{' '}
          {ticket.passenger_count} passenger{ticket.passenger_count === 1 ? '' : 's'}
        </p>
        <p className="text-xs text-gray-400">{ticket.ticket_number}</p>
      </div>
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
        {ticket.status}
      </span>
    </Link>
  )
}
