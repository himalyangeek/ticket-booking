import { useEffect, useState } from 'react'
import { DateField } from '../components/DateField'
import { SnakeLoader } from '../components/SnakeLoader'
import { StaffTabBar } from '../components/StaffTabBar'
import { listAdminTickets } from '../lib/api'

type TicketRow = Awaited<ReturnType<typeof listAdminTickets>>[number]

function isExpired(ticket: TicketRow) {
  return ticket.status === 'ACTIVE' && new Date(ticket.expires_at).getTime() <= Date.now()
}

// Bookings can be filtered across any date, unlike the public booking
// calendar which only looks a month ahead — no "today" floor here.
function isoDaysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
const FILTER_MIN_DATE = '2000-01-01'
const FILTER_MAX_DATE = isoDaysFromNow(3650)

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listAdminTickets({ from: from || undefined, to: to || undefined })
      .then(setTickets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [from, to])

  return (
    <div className="min-h-screen">
      <StaffTabBar />
      <div className="px-4">
        <div className="mx-auto my-6 max-w-5xl rounded-2xl bg-white/95 px-4 py-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-4 font-display text-2xl font-bold text-jungle-800">Booking Dashboard</h1>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-40">
              <DateField label="Visit date from" value={from} onChange={setFrom} minDate={FILTER_MIN_DATE} maxDate={FILTER_MAX_DATE} />
            </div>
            <div className="w-40">
              <DateField label="Visit date to" value={to} onChange={setTo} minDate={FILTER_MIN_DATE} maxDate={FILTER_MAX_DATE} />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
                className="text-sm text-jungle-600 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {error && <p className="text-red-600">{error}</p>}

          {loading ? (
            <SnakeLoader label="Loading bookings…" />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-jungle-50 text-jungle-700">
                  <tr>
                    <th className="p-2">Ticket #</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Expired?</th>
                    <th className="p-2">Program</th>
                    <th className="p-2">Visit date</th>
                    <th className="p-2">Booker</th>
                    <th className="p-2">Mobile</th>
                    <th className="p-2">Aadhaar</th>
                    <th className="p-2">Pax</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{t.ticket_number}</td>
                      <td className="p-2">{t.status}</td>
                      <td className="p-2">
                        {isExpired(t) ? (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Expired</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">No</span>
                        )}
                      </td>
                      <td className="p-2">{t.programs?.name}</td>
                      <td className="p-2">{t.visit_date}</td>
                      <td className="p-2">{t.booker_name}</td>
                      <td className="p-2">{t.booker_mobile}</td>
                      <td className="p-2">•••• {t.aadhaar_last4}</td>
                      <td className="p-2">{t.passenger_count}</td>
                      <td className="p-2">₹{t.amount}</td>
                      <td className="p-2">{t.payment_status}</td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-gray-400">
                        No bookings in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
