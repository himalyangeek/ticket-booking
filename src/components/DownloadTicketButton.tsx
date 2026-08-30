import { useState } from 'react'
import { downloadTicketImage, type TicketImageMeta } from '../lib/ticketImage'
import type { QrPayload } from '../types/ticket'

export function DownloadTicketButton({ qr, meta }: { qr: QrPayload; meta: TicketImageMeta }) {
  const [downloading, setDownloading] = useState(false)

  async function handleClick() {
    setDownloading(true)
    try {
      await downloadTicketImage(qr, meta)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={downloading}
      className="rounded-full border-2 border-jungle-500 px-6 py-2 font-display font-bold text-jungle-700 disabled:opacity-50"
    >
      {downloading ? 'Preparing…' : '⬇ Download Ticket'}
    </button>
  )
}
