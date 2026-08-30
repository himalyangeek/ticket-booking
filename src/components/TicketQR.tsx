import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { QrPayload } from '../types/ticket'

export function TicketQR({ qr }: { qr: QrPayload }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(JSON.stringify(qr), { errorCorrectionLevel: 'M', margin: 1, width: 320 }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [qr])

  if (!dataUrl) return <div className="aspect-square w-full max-w-xs animate-pulse rounded bg-gray-100" />

  return <img src={dataUrl} alt="Ticket QR code" className="w-full max-w-xs rounded border" />
}
