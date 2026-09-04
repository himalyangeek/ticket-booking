import { useState } from 'react'
import { downloadTicketImage, type TicketImageMeta } from '../lib/ticketImage'
import type { QrPayload } from '../types/ticket'

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

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
      className="flex items-center justify-center gap-2 rounded-full border-2 border-jungle-500 px-6 py-2 font-display font-bold text-jungle-700 disabled:opacity-70"
    >
      {downloading ? (
        <>
          <Spinner />
          Preparing…
        </>
      ) : (
        '⬇ Download Ticket'
      )}
    </button>
  )
}
