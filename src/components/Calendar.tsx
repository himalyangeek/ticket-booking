import { useMemo, useState } from 'react'

interface CalendarProps {
  value: string | null
  onChange: (isoDate: string) => void
  /** How many days ahead (from today) are bookable. */
  daysAhead?: number
}

function toISODate(d: Date) {
  // Use local date parts, not toISOString() — that converts to UTC first, which
  // shifts the date backward by a day in timezones ahead of UTC (e.g. IST).
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function Calendar({ value, onChange, daysAhead = 30 }: CalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + daysAhead)
    return d
  }, [today, daysAhead])

  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const startOffset = firstOfMonth.getDay()
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()

    const cells: (Date | null)[] = Array(startOffset).fill(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
    }
    while (cells.length % 7 !== 0) cells.push(null)

    const rows: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [viewMonth])

  const canGoPrev = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = viewMonth < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  return (
    <div className="rounded-xl border-2 border-jungle-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="rounded-full px-2 py-1 text-jungle-700 disabled:opacity-30"
        >
          ◀
        </button>
        <p className="font-display font-bold text-jungle-800">
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="rounded-full px-2 py-1 text-jungle-700 disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-jungle-500">
        {WEEKDAYS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      {weeks.map((row, i) => (
        <div key={i} className="grid grid-cols-7 gap-1">
          {row.map((date, j) => {
            if (!date) return <div key={j} />
            const iso = toISODate(date)
            const disabled = date < today || date > maxDate
            const selected = value === iso
            return (
              <button
                key={j}
                type="button"
                disabled={disabled}
                onClick={() => onChange(iso)}
                className={`aspect-square rounded-full text-sm transition ${
                  selected
                    ? 'bg-jungle-500 font-bold text-white'
                    : disabled
                      ? 'text-gray-300'
                      : 'text-jungle-800 hover:bg-jungle-100'
                }`}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
