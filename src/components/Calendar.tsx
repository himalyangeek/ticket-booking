import { useMemo, useState } from 'react'

interface CalendarProps {
  value: string | null
  onChange: (isoDate: string) => void
  /** How many days ahead (from today) are bookable. Ignored if maxDate is given. */
  daysAhead?: number
  /** ISO date floor (inclusive). Defaults to today. */
  minDate?: string
  /** ISO date ceiling (inclusive). Defaults to today + daysAhead. */
  maxDate?: string
}

function toISODate(d: Date) {
  // Use local date parts, not toISOString() — that converts to UTC first, which
  // shifts the date backward by a day in timezones ahead of UTC (e.g. IST).
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function Calendar({ value, onChange, daysAhead = 30, minDate, maxDate }: CalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const rangeMin = useMemo(() => (minDate ? parseISODate(minDate) : today), [minDate, today])
  const rangeMax = useMemo(() => {
    if (maxDate) return parseISODate(maxDate)
    const d = new Date(today)
    d.setDate(d.getDate() + daysAhead)
    return d
  }, [maxDate, today, daysAhead])

  const [viewMonth, setViewMonth] = useState(() => {
    const start = value ? parseISODate(value) : rangeMin
    return new Date(start.getFullYear(), start.getMonth(), 1)
  })

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

  const canGoPrev = viewMonth > new Date(rangeMin.getFullYear(), rangeMin.getMonth(), 1)
  const canGoNext = viewMonth < new Date(rangeMax.getFullYear(), rangeMax.getMonth(), 1)

  return (
    <div className="w-full max-w-full rounded-xl border-2 border-jungle-200 bg-white p-3 box-border">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-jungle-700 disabled:opacity-30"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.5 4.5 L7 10 L12.5 15.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="font-display font-bold text-jungle-800">
          {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
        </p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-jungle-700 disabled:opacity-30"
          aria-label="Next month"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7.5 4.5 L13 10 L7.5 15.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold text-jungle-500">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="flex items-center justify-center">
            {w}
          </div>
        ))}
      </div>

      {weeks.map((row, i) => (
        <div key={i} className="grid grid-cols-7 gap-y-1">
          {row.map((date, j) => {
            if (!date) return <div key={j} />
            const iso = toISODate(date)
            const disabled = date < rangeMin || date > rangeMax
            const selected = value === iso
            return (
              <div key={j} className="flex items-center justify-center">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(iso)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm transition ${
                    selected
                      ? 'bg-jungle-500 font-bold text-white'
                      : disabled
                        ? 'text-gray-300'
                        : 'text-jungle-800 hover:bg-jungle-100'
                  }`}
                >
                  {date.getDate()}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
