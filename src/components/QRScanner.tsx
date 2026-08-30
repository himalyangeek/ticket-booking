import { Scanner } from '@yudiel/react-qr-scanner'
import { useEffect, useRef } from 'react'

interface QRScannerProps {
  onDecode: (rawValue: string) => void
  paused?: boolean
}

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
        constraints={{ facingMode: 'environment' }}
      />
    </div>
  )
}
