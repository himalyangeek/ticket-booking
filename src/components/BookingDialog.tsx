import { useEffect, useState } from 'react'
import { Calendar } from './Calendar'
import { DownloadTicketButton } from './DownloadTicketButton'
import { MonkeyMascot } from './MonkeyMascot'
import { TicketQR } from './TicketQR'
import { createTicket, listSlotsForDate } from '../lib/api'
import { bookingSchema } from '../lib/validation'
import type { Program, ProgramSlot, QrPayload, Ticket } from '../types/ticket'

type Step = 'details' | 'form' | 'success'
type FieldKey = 'name' | 'mobile' | 'aadhaar'

const FIELD_MAX: Record<FieldKey, number> = { name: 40, mobile: 10, aadhaar: 12 }

export function BookingDialog({ program, onClose }: { program: Program; onClose: () => void }) {
  const [step, setStep] = useState<Step>('details')

  const [date, setDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<ProgramSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotId, setSlotId] = useState<string | null>(null)
  const [passengerCount, setPassengerCount] = useState(1)

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [activeField, setActiveField] = useState<FieldKey | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const [result, setResult] = useState<{ ticket: Ticket; qr: QrPayload } | null>(null)

  useEffect(() => {
    if (!date) return
    setSlotId(null)
    setSlotsLoading(true)
    listSlotsForDate(program.id, date)
      .then(setSlots)
      .finally(() => setSlotsLoading(false))
  }, [date, program.id])

  const selectedSlot = slots.find((s) => s.id === slotId)
  const total = program.price * passengerCount

  const values: Record<FieldKey, string> = { name, mobile, aadhaar }
  const setters: Record<FieldKey, (v: string) => void> = { name: setName, mobile: setMobile, aadhaar: setAadhaar }

  // "Typing invalid" — flags obviously wrong characters immediately, so the mascot
  // reacts as you type rather than waiting for a full-field validation pass.
  function isTypingInvalid(field: FieldKey, value: string): boolean {
    if (field === 'mobile') return value !== '' && (!/^\d*$/.test(value) || (value.length === 10 && !/^[6-9]/.test(value)))
    if (field === 'aadhaar') return value !== '' && (!/^\d*$/.test(value) || value.length > 12)
    return false
  }

  const activeInvalid = activeField !== null && isTypingInvalid(activeField, values[activeField])
  const activeGaze = activeField !== null ? Math.min(1, values[activeField].length / FIELD_MAX[activeField]) : 0

  function handleFieldChange(field: FieldKey, raw: string) {
    // Deliberately NOT stripping non-digit characters here — the mascot needs to
    // actually see a stray letter to react to it. Length is still capped so typing
    // past the field's limit doesn't just keep growing forever.
    const cleaned = raw.slice(0, FIELD_MAX[field])
    setters[field](cleaned)
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handlePay() {
    if (!slotId) return
    const parsed = bookingSchema.safeParse({
      programId: program.id,
      slotId,
      passengerCount,
      bookerName: name,
      bookerMobile: mobile,
      aadhaarNumber: aadhaar,
    })
    if (!parsed.success) {
      const errors: Partial<Record<FieldKey, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'bookerName') errors.name = issue.message
        if (key === 'bookerMobile') errors.mobile = issue.message
        if (key === 'aadhaarNumber') errors.aadhaar = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const { ticket, qr } = await createTicket(parsed.data)
      setResult({ ticket, qr })
      setStep('success')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-jungle-900/50 p-4">
      <div className="animate-pop-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-bold text-jungle-800">
            {program.animal_emoji} {program.name}
          </p>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {step === 'details' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">{program.description}</p>
            <div className="flex flex-wrap gap-1">
              {program.highlight_animals.map((a) => (
                <span key={a} className="rounded-full bg-jungle-100 px-2 py-1 text-xs text-jungle-700">
                  {a}
                </span>
              ))}
            </div>

            <Calendar value={date} onChange={setDate} />

            {date && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-jungle-700">Available safaris</p>
                {slotsLoading && <p className="text-sm text-gray-400">Loading…</p>}
                {!slotsLoading && slots.length === 0 && (
                  <p className="text-sm text-gray-400">No safaris scheduled on this date.</p>
                )}
                {slots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    className={`rounded-lg border-2 p-2 text-left text-sm transition ${
                      slotId === s.id ? 'border-jungle-500 bg-jungle-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="font-semibold">{s.session_label}</span> ·{' '}
                    {new Date(s.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ·{' '}
                    {s.available_capacity} seats left
                  </button>
                ))}
              </div>
            )}

            {selectedSlot && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-jungle-700">Passengers</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPassengerCount((n) => Math.max(1, n - 1))}
                    className="h-8 w-8 rounded-full bg-jungle-100 text-jungle-700"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{passengerCount}</span>
                  <button
                    onClick={() =>
                      setPassengerCount((n) => Math.min(selectedSlot.available_capacity, n + 1))
                    }
                    className="h-8 w-8 rounded-full bg-jungle-100 text-jungle-700"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={!slotId}
              onClick={() => setStep('form')}
              className="rounded-full bg-jungle-500 py-2 font-display font-bold text-white disabled:opacity-40"
            >
              Continue — ₹{selectedSlot ? total.toFixed(0) : program.price}
            </button>
          </div>
        )}

        {step === 'form' && (
          <div className="flex flex-col gap-3">
            <MonkeyMascot focused={activeField !== null} gazeRatio={activeGaze} invalid={activeInvalid} />

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Booker name</span>
              <input
                value={name}
                onFocus={() => setActiveField('name')}
                onBlur={() => setActiveField(null)}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="rounded-lg border-2 border-jungle-200 px-3 py-2"
              />
              {fieldErrors.name && <span className="text-xs text-red-600">{fieldErrors.name}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Mobile number</span>
              <input
                value={mobile}
                inputMode="numeric"
                onFocus={() => setActiveField('mobile')}
                onBlur={() => setActiveField(null)}
                onChange={(e) => handleFieldChange('mobile', e.target.value)}
                className={`rounded-lg border-2 px-3 py-2 ${
                  activeField === 'mobile' && activeInvalid ? 'border-red-400' : 'border-jungle-200'
                }`}
              />
              {fieldErrors.mobile && <span className="text-xs text-red-600">{fieldErrors.mobile}</span>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Aadhaar number (booker)</span>
              <input
                value={aadhaar}
                inputMode="numeric"
                onFocus={() => setActiveField('aadhaar')}
                onBlur={() => setActiveField(null)}
                onChange={(e) => handleFieldChange('aadhaar', e.target.value)}
                className={`rounded-lg border-2 px-3 py-2 ${
                  activeField === 'aadhaar' && activeInvalid ? 'border-red-400' : 'border-jungle-200'
                }`}
              />
              {fieldErrors.aadhaar && <span className="text-xs text-red-600">{fieldErrors.aadhaar}</span>}
              <span className="text-xs text-gray-400">Only the last 4 digits are ever stored.</span>
            </label>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
              onClick={handlePay}
              disabled={submitting}
              className="rounded-full bg-sunlight-500 py-2 font-display font-bold text-jungle-900 disabled:opacity-40"
            >
              {submitting ? 'Processing payment…' : `Pay ₹${total.toFixed(0)}`}
            </button>
          </div>
        )}

        {step === 'success' && result && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-lg font-bold text-jungle-700">Booking confirmed! 🎉</p>
            <TicketQR qr={result.qr} />
            <p className="font-mono text-sm">{result.ticket.ticket_number}</p>
            <p className="text-xs text-gray-500">
              Save your ticket number and mobile number — you can look this ticket up anytime from{' '}
              <span className="font-semibold">Find My Ticket</span>.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <DownloadTicketButton
                qr={result.qr}
                meta={{
                  ticketNumber: result.ticket.ticket_number,
                  programName: program.name,
                  forestRange: program.forest_range,
                  visitDate: result.ticket.visit_date,
                  sessionLabel: selectedSlot?.session_label,
                  passengerCount: result.ticket.passenger_count,
                  status: result.ticket.status,
                }}
              />
              <button onClick={onClose} className="rounded-full bg-jungle-500 px-6 py-2 font-bold text-white">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
