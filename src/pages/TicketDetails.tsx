import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { TicketQR } from '../components/TicketQR'
import { getTicket, getTicketQr } from '../lib/api'
import type { QrPayload } from '../types/ticket'

type TicketRow = Awaited<ReturnType<typeof getTicket>>

export default function TicketDetails() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [ticket, setTicket] = useState<TicketRow | null>(null)
  const [qr, setQr] = useState<QrPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticketId) return
    getTicket(ticketId)
      .then(setTicket)
      .catch((e) => setError(e.message))
    getTicketQr(ticketId)
      .then(({ qr }) => setQr(qr))
      .catch((e) => setError(e.message))
  }, [ticketId])

  if (error) return <p className="p-6 text-center text-red-600">{error}</p>
  if (!ticket) return <p className="p-6 text-center text-gray-500">Loading…</p>

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold">{ticket.programs?.name}</h1>
      <p className="text-gray-500">
        {ticket.program_slots ? new Date(ticket.program_slots.starts_at).toLocaleString() : ''}
      </p>
      <p className="text-sm text-gray-500">
        {ticket.passenger_count} passenger{ticket.passenger_count === 1 ? '' : 's'} · {ticket.status}
      </p>

      {ticket.status === 'ACTIVE' && qr ? (
        <TicketQR qr={qr} />
      ) : (
        <p className="text-gray-400">QR not available for a {ticket.status.toLowerCase()} ticket.</p>
      )}

      <p className="text-xs text-gray-400">{ticket.ticket_number}</p>
    </div>
  )
}
