import { useState } from 'react'
import { QRScanner } from '../components/QRScanner'
import { StaffTabBar } from '../components/StaffTabBar'
import { consumeTicket, verifyTicket } from '../lib/api'
import { parseQrPayload } from '../lib/validation'
import type { ScanOutcome } from '../types/ticket'

export default function Scanner() {
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  async function handleDecode(rawValue: string) {
    setParseError(null)
    setOutcome(null)

    const parsed = parseQrPayload(rawValue)
    if (!parsed.success) {
      setParseError('Not a recognized ticket QR code.')
      return
    }

    setBusy(true)
    try {
      const result = await verifyTicket(parsed.data)
      setOutcome(result)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleAdmit() {
    if (!outcome?.ticket) return
    setBusy(true)
    try {
      const result = await consumeTicket(outcome.ticket.id)
      setOutcome(result)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Consumption failed')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setOutcome(null)
    setParseError(null)
  }

  return (
    <div className="min-h-screen">
      <StaffTabBar />
      <div className="px-4">
        <div className="mx-auto my-6 flex max-w-md flex-col items-center gap-4 rounded-2xl bg-white/95 px-4 py-10 shadow-xl backdrop-blur-sm">
          <h1 className="w-full text-2xl font-semibold">Scan tickets</h1>

          <QRScanner onDecode={handleDecode} paused={busy || outcome !== null} />

          {parseError && <p className="text-red-600">{parseError}</p>}

          {outcome && (
            <div
              className={`w-full rounded border p-4 text-center ${
                outcome.result === 'VALID' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}
            >
              <p className={`text-lg font-semibold ${outcome.result === 'VALID' ? 'text-green-700' : 'text-red-700'}`}>
                {outcome.result}
              </p>
              {outcome.reason && <p className="text-sm text-gray-600">{outcome.reason}</p>}
              {outcome.ticket && (
                <div className="mt-2 flex flex-col gap-0.5 text-left text-sm text-gray-700">
                  <p className="text-center font-mono text-xs text-gray-500">{outcome.ticket.ticket_number}</p>
                  <p>
                    <span className="text-gray-500">Booker:</span> {outcome.ticket.booker_name}
                  </p>
                  <p>
                    <span className="text-gray-500">Mobile:</span> {outcome.ticket.booker_mobile}
                  </p>
                  <p>
                    <span className="text-gray-500">Aadhaar:</span> •••• •••• {outcome.ticket.aadhaar_last4}
                  </p>
                  <p>
                    <span className="text-gray-500">Passengers:</span> {outcome.ticket.passenger_count}
                  </p>
                </div>
              )}

              <div className="mt-3 flex justify-center gap-2">
                {outcome.result === 'VALID' && outcome.ticket?.status === 'ACTIVE' && (
                  <button
                    onClick={handleAdmit}
                    disabled={busy}
                    className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                  >
                    Admit
                  </button>
                )}
                <button onClick={reset} disabled={busy} className="rounded border px-4 py-2">
                  Scan next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
