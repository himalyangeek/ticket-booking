import QRCode from 'qrcode'
import type { QrPayload } from '../types/ticket'

export interface TicketImageMeta {
  ticketNumber: string
  programName: string
  forestRange: string
  visitDate: string
  sessionLabel?: string
  passengerCount: number
  status: string
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Renders a self-contained ticket card (QR + booking details) as a PNG and triggers a download. */
export async function downloadTicketImage(qr: QrPayload, meta: TicketImageMeta) {
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qr), { errorCorrectionLevel: 'M', margin: 1, width: 480 })
  const qrImage = await loadImage(qrDataUrl)

  const width = 520
  const height = 780
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // header band
  ctx.fillStyle = '#1d5f2a'
  ctx.fillRect(0, 0, width, 110)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px "Baloo 2", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('🌿 CG Forest Safari', width / 2, 48)
  ctx.font = '16px sans-serif'
  ctx.fillText('E-Ticket', width / 2, 78)

  // body text
  ctx.fillStyle = '#123a1c'
  ctx.textAlign = 'left'
  let y = 150
  const left = 32

  ctx.font = 'bold 24px "Baloo 2", sans-serif'
  ctx.fillText(meta.programName, left, y)
  y += 30

  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#2f9c42'
  ctx.fillText(meta.forestRange, left, y)
  y += 34

  ctx.fillStyle = '#374151'
  ctx.font = '16px sans-serif'
  const details = [
    `Visit date: ${new Date(meta.visitDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`,
    meta.sessionLabel ? `Session: ${meta.sessionLabel}` : null,
    `Passengers: ${meta.passengerCount}`,
    `Status: ${meta.status}`,
  ].filter(Boolean) as string[]
  for (const line of details) {
    ctx.fillText(line, left, y)
    y += 26
  }

  // QR code, centered
  const qrSize = 360
  const qrX = (width - qrSize) / 2
  const qrY = y + 20
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

  // ticket number + footer note
  ctx.textAlign = 'center'
  ctx.fillStyle = '#123a1c'
  ctx.font = 'bold 18px monospace'
  ctx.fillText(meta.ticketNumber, width / 2, qrY + qrSize + 40)

  ctx.font = '13px sans-serif'
  ctx.fillStyle = '#6b7280'
  ctx.fillText('Present this QR code at the safari gate', width / 2, qrY + qrSize + 66)

  const pngUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = pngUrl
  link.download = `${meta.ticketNumber}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
