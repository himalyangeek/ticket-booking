import { useEffect, useState, type ReactNode } from 'react'
import { DateTimeField } from '../components/DateField'
import { SnakeLoader } from '../components/SnakeLoader'
import { StaffTabBar } from '../components/StaffTabBar'
import {
  adminCreateProgram,
  adminCreateSlot,
  adminDeleteProgram,
  adminDeleteSlot,
  adminListProgramsWithSlots,
  adminUpdateProgram,
  type ProgramInput,
  type ProgramWithSlots,
  type SlotInput,
} from '../lib/api'
import type { ProgramSlot } from '../types/ticket'

function fromLocalInputValue(value: string) {
  return new Date(value).toISOString()
}

// Safari timings can be scheduled well beyond the public 30-day booking window.
function isoDaysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
const SLOT_MIN_DATE = isoDaysFromNow(0)
const SLOT_MAX_DATE = isoDaysFromNow(730)

const inputClass = 'w-full min-w-0 box-border rounded border px-2 py-1.5 text-sm'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      {children}
    </label>
  )
}

const emptyProgramForm = {
  name: '',
  description: '',
  price: '',
  forest_range: '',
  highlight_animals: '',
  animal_emoji: '🐯',
}

function NewProgramForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyProgramForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!form.name || !form.forest_range || !form.price) {
      setError('Name, forest range and price are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const input: ProgramInput = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        forest_range: form.forest_range,
        highlight_animals: form.highlight_animals
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        animal_emoji: form.animal_emoji || '🐯',
      }
      await adminCreateProgram(input)
      setForm(emptyProgramForm)
      setOpen(false)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create program')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-jungle-300 py-3 text-jungle-600 hover:bg-jungle-50"
      >
        + Add safari program
      </button>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border-2 border-jungle-200 p-4">
      <p className="font-display font-bold text-jungle-800">New safari program</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Program name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Forest range">
          <input
            value={form.forest_range}
            onChange={(e) => setForm({ ...form, forest_range: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Price per person (₹)">
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Emoji">
          <input
            value={form.animal_emoji}
            onChange={(e) => setForm({ ...form, animal_emoji: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Description">
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Native animals (comma separated, e.g. Tiger, Leopard, Bison)">
        <input
          value={form.highlight_animals}
          onChange={(e) => setForm({ ...form, highlight_animals: e.target.value })}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-full bg-jungle-500 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Create program'}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-full border px-4 py-1.5 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}

function NewSlotForm({ programId, onCreated }: { programId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [sessionLabel, setSessionLabel] = useState('Morning Safari')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [capacity, setCapacity] = useState('20')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!start || !end || !capacity) {
      setError('Start, end and capacity are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const cap = Number(capacity)
      const input: SlotInput = {
        program_id: programId,
        starts_at: fromLocalInputValue(start),
        ends_at: fromLocalInputValue(end),
        capacity: cap,
        available_capacity: cap,
        session_label: sessionLabel,
      }
      await adminCreateSlot(input)
      setStart('')
      setEnd('')
      setOpen(false)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add slot')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-jungle-600 underline">
        + Add safari timing
      </button>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border p-3">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Session label">
          <input value={sessionLabel} onChange={(e) => setSessionLabel(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Capacity">
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={inputClass}
          />
        </Field>
        <DateTimeField label="Starts at" value={start} onChange={setStart} minDate={SLOT_MIN_DATE} maxDate={SLOT_MAX_DATE} />
        <DateTimeField label="Ends at" value={end} onChange={setEnd} minDate={SLOT_MIN_DATE} maxDate={SLOT_MAX_DATE} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-full bg-jungle-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add timing'}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-full border px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    </div>
  )
}

function SlotRow({ slot, onChanged }: { slot: ProgramSlot; onChanged: () => void }) {
  const booked = slot.capacity - slot.available_capacity

  async function handleDelete() {
    if (booked > 0) {
      if (!confirm(`${booked} passenger(s) already booked this slot. Delete anyway?`)) return
    } else if (!confirm('Delete this safari timing?')) {
      return
    }
    await adminDeleteSlot(slot.id)
    onChanged()
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm">
      <div className="min-w-0">
        <span className="font-semibold">{slot.session_label}</span> ·{' '}
        {new Date(slot.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
        {slot.available_capacity}/{slot.capacity} seats left
      </div>
      <button onClick={handleDelete} className="shrink-0 text-xs text-red-600 underline">
        Delete
      </button>
    </div>
  )
}

function ProgramCard({ program, onChanged }: { program: ProgramWithSlots; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: program.name,
    description: program.description ?? '',
    price: String(program.price),
    forest_range: program.forest_range,
    highlight_animals: program.highlight_animals.join(', '),
    animal_emoji: program.animal_emoji,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await adminUpdateProgram(program.id, {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        forest_range: form.forest_range,
        highlight_animals: form.highlight_animals
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        animal_emoji: form.animal_emoji,
      })
      setEditing(false)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (program.program_slots.length > 0) {
      if (!confirm(`This program has ${program.program_slots.length} timing(s). Delete program and all its timings?`)) return
    } else if (!confirm(`Delete "${program.name}"?`)) {
      return
    }
    await adminDeleteProgram(program.id)
    onChanged()
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border-2 border-jungle-100 p-4">
      {editing ? (
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Program name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Forest range">
              <input
                value={form.forest_range}
                onChange={(e) => setForm({ ...form, forest_range: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Price per person (₹)">
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Emoji">
              <input
                value={form.animal_emoji}
                onChange={(e) => setForm({ ...form, animal_emoji: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Description">
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Native animals (comma separated)">
            <input
              value={form.highlight_animals}
              onChange={(e) => setForm({ ...form, highlight_animals: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-jungle-500 px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-full border px-4 py-1.5 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-jungle-800">
              {program.animal_emoji} {program.name}
            </p>
            <p className="text-xs font-semibold text-jungle-500">{program.forest_range}</p>
            <p className="text-sm text-gray-600">{program.description}</p>
            <p className="text-sm font-bold text-jungle-700">₹{program.price} / person</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => setEditing(true)} className="text-sm text-jungle-600 underline">
              Edit
            </button>
            <button onClick={handleDelete} className="text-sm text-red-600 underline">
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-2 border-t pt-3">
        <p className="text-sm font-semibold text-jungle-700">Safari timings</p>
        {program.program_slots.length === 0 && <p className="text-sm text-gray-400">No timings added yet.</p>}
        {program.program_slots
          .slice()
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          .map((slot) => (
            <SlotRow key={slot.id} slot={slot} onChanged={onChanged} />
          ))}
        <NewSlotForm programId={program.id} onCreated={onChanged} />
      </div>
    </div>
  )
}

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<ProgramWithSlots[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    adminListProgramsWithSlots()
      .then(setPrograms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  return (
    <div className="min-h-screen">
      <StaffTabBar />
      <div className="px-4">
        <div className="mx-auto my-6 max-w-3xl min-w-0 rounded-2xl bg-white/95 px-4 py-8 shadow-xl backdrop-blur-sm">
          <h1 className="mb-4 font-display text-2xl font-bold text-jungle-800">Manage Safaris</h1>

          {error && <p className="text-red-600">{error}</p>}

          {loading ? (
            <SnakeLoader label="Loading safaris…" />
          ) : (
            <div className="flex min-w-0 flex-col gap-4">
              <NewProgramForm onCreated={reload} />
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} onChanged={reload} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
