import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketCard } from '../components/TicketCard'
import { listMyTickets } from '../lib/api'

type TicketRow = Awaited<ReturnType<typeof listMyTickets>>[number]

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listMyTickets()
      .then(setTickets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-10">
      <h1 className="text-2xl font-semibold">My tickets</h1>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && tickets.length === 0 && (
        <p className="text-gray-500">
          No tickets yet. <Link to="/book" className="underline">Book one</Link>.
        </p>
      )}

      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  )
}
