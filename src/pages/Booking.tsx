import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket, listPrograms, listSlots } from '../lib/api'
import type { Program, ProgramSlot } from '../types/ticket'

export default function Booking() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [slots, setSlots] = useState<ProgramSlot[]>([])
  const [programId, setProgramId] = useState('')
  const [slotId, setSlotId] = useState('')
  const [passengerCount, setPassengerCount] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPrograms().then(setPrograms).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    setSlotId('')
    setSlots([])
    if (!programId) return
    listSlots(programId).then(setSlots).catch((e) => setError(e.message))
  }, [programId])

  const selectedProgram = programs.find((p) => p.id === programId)
  const selectedSlot = slots.find((s) => s.id === slotId)
  const total = selectedProgram ? selectedProgram.price * passengerCount : 0

  async function handleBook() {
    if (!programId || !slotId) return
    setSubmitting(true)
    setError(null)
    try {
      const { ticket } = await createTicket({ programId, slotId, passengerCount })
      navigate(`/tickets/${ticket.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Book a ticket</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Program</span>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">Select a program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{p.price}
            </option>
          ))}
        </select>
      </label>

      {programId && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Slot</span>
          <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className="rounded border px-3 py-2">
            <option value="">Select a slot</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.starts_at).toLocaleString()} · {s.available_capacity} seats left
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-gray-600">Passengers</span>
        <input
          type="number"
          min={1}
          max={selectedSlot?.available_capacity ?? 20}
          value={passengerCount}
          onChange={(e) => setPassengerCount(Number(e.target.value))}
          className="rounded border px-3 py-2"
        />
      </label>

      {selectedProgram && <p className="text-sm text-gray-600">Total: ₹{total.toFixed(2)}</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleBook}
        disabled={!programId || !slotId || submitting}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {submitting ? 'Booking…' : 'Confirm booking'}
      </button>
    </div>
  )
}
