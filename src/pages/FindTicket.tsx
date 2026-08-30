import { useState, type FormEvent } from 'react'
import { Navbar } from '../components/Navbar'
import { TicketQR } from '../components/TicketQR'
import { findTicket } from '../lib/api'
import type { QrPayload, Ticket } from '../types/ticket'

export default function FindTicket() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [mobile, setMobile] = useState('')
  const [result, setResult] = useState<{ ticket: Ticket; qr: QrPayload } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const data = await findTicket({ ticketNumber, mobile })
      setResult(data)
    } catch {
      setError('No ticket found for that number and mobile number.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-white/95 px-4 py-10 shadow-xl backdrop-blur-sm">
        <h1 className="font-display text-2xl font-bold text-jungle-800">Find My Ticket</h1>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <input
            required
            placeholder="Ticket number (e.g. TKT-...)"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
            className="rounded-lg border-2 border-jungle-200 px-3 py-2"
          />
          <input
            required
            placeholder="Mobile number"
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
            className="rounded-lg border-2 border-jungle-200 px-3 py-2"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-jungle-500 py-2 font-display font-bold text-white disabled:opacity-40"
          >
            {loading ? 'Searching…' : 'Find ticket'}
          </button>
        </form>

        {result && (
          <div className="flex flex-col items-center gap-2 text-center">
            <TicketQR qr={result.qr} />
            <p className="font-mono text-sm">{result.ticket.ticket_number}</p>
            <p className="text-sm text-gray-500">
              {result.ticket.passenger_count} passenger{result.ticket.passenger_count === 1 ? '' : 's'} ·{' '}
              {result.ticket.status}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
