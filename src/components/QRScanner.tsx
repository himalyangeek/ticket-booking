import { Scanner } from '@yudiel/react-qr-scanner'
import { useEffect, useRef } from 'react'

interface QRScannerProps {
  onDecode: (rawValue: string) => void
  paused?: boolean
}

// Modest fixed resolution — QR decoding doesn't need HD, and asking for less
// lets getUserMedia negotiate a stream faster than the browser's default.
const CONSTRAINTS = { facingMode: 'environment', width: { ideal: 720 }, height: { ideal: 720 } }

export function QRScanner({ onDecode, paused }: QRScannerProps) {
  const lastValueRef = useRef<string | null>(null)

  useEffect(() => {
    if (!paused) lastValueRef.current = null
  }, [paused])

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border">
      <Scanner
        paused={paused}
        onScan={(codes) => {
          const value = codes[0]?.rawValue
          if (!value || value === lastValueRef.current) return
          lastValueRef.current = value
          onDecode(value)
        }}
        onError={(error) => console.error('QR scanner error', error)}
        constraints={CONSTRAINTS}
        // We never show zoom/torch controls, so there's nothing to wait for
        // here — the library's default 500ms only exists to let those
        // capabilities settle before reading them.
        settleDelayMs={0}
      />
    </div>
  )
}
