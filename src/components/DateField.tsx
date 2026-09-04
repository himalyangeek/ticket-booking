import { useEffect, useRef, useState } from 'react'
import { Calendar } from './Calendar'

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-jungle-500" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" strokeLinecap="round" />
    </svg>
  )
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

interface DateFieldProps {
  label: string
  value: string
  onChange: (iso: string) => void
  minDate?: string
  maxDate?: string
  placeholder?: string
}

/** A grid-calendar date picker in a popover — never triggers the OS's native date picker. */
export function DateField({ label, value, onChange, minDate, maxDate, placeholder = 'Select date' }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))

  return (
    <div ref={ref} className="relative flex min-w-0 flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded border px-3 py-1.5 text-left text-sm"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value ? formatDisplayDate(value) : placeholder}</span>
        <CalendarIcon />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-72 max-w-[90vw]">
          <Calendar
            value={value || null}
            onChange={(iso) => {
              onChange(iso)
              setOpen(false)
            }}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

interface DateTimeFieldProps {
  label: string
  /** Combined local value as "YYYY-MM-DDTHH:mm", or '' if unset. */
  value: string
  onChange: (localValue: string) => void
  minDate?: string
  maxDate?: string
}

/** Date (grid popover) + time (plain selects) — neither ever opens a native OS picker. */
export function DateTimeField({ label, value, onChange, minDate, maxDate }: DateTimeFieldProps) {
  const [date, time] = value ? value.split('T') : ['', '06:00']
  const [hour, minute] = time.split(':')

  function commit(nextDate: string, nextHour: string, nextMinute: string) {
    if (!nextDate) return
    onChange(`${nextDate}T${nextHour}:${nextMinute}`)
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <DateField
        label={label}
        value={date}
        onChange={(iso) => commit(iso, hour, minute)}
        minDate={minDate}
        maxDate={maxDate}
      />
      <div className="flex items-center gap-1">
        <select
          value={hour}
          onChange={(e) => commit(date, e.target.value, minute)}
          disabled={!date}
          className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm disabled:opacity-50"
          aria-label={`${label} hour`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-gray-400">:</span>
        <select
          value={minute}
          onChange={(e) => commit(date, hour, e.target.value)}
          disabled={!date}
          className="min-w-0 flex-1 rounded border px-2 py-1.5 text-sm disabled:opacity-50"
          aria-label={`${label} minute`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
