import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BookingDialog } from '../components/BookingDialog'
import { JungleBackground } from '../components/JungleBackground'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../lib/AuthContext'
import { listPrograms } from '../lib/api'
import type { Program } from '../types/ticket'

export default function Home() {
  const { session, profile, loading } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [selected, setSelected] = useState<Program | null>(null)
  const [hoveredCard, setHoveredCard] = useState(false)

  useEffect(() => {
    listPrograms().then(setPrograms)
  }, [])

  // A signed-in staff member opening the app should land straight on their
  // own area, not the public booking page.
  if (!loading && session && profile) {
    return <Navigate to={profile.role === 'ADMIN' ? '/admin' : '/scan'} replace />
  }

  return (
    <div>
      <JungleBackground watching={hoveredCard} />
      <Navbar />

      <header className="px-4 py-10 text-center sm:px-8">
        <p className="animate-bounce-slow text-6xl">🐯🌳🐒</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">
          Explore Chhattisgarh's Wild Side
        </h1>
        <p className="mx-auto mt-2 max-w-md text-jungle-100">
          Pick a forest range, choose your safari date, and meet the tigers, leopards and bison of Chhattisgarh!
          Hover a card — the monkeys in the trees will watch you back. 🐒
        </p>
      </header>

      <main className="grid grid-cols-1 gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
        {programs.map((program) => (
          <button
            key={program.id}
            onClick={() => setSelected(program)}
            onMouseEnter={() => setHoveredCard(true)}
            onMouseLeave={() => setHoveredCard(false)}
            className="animate-pop-in flex flex-col gap-2 rounded-2xl border-2 border-jungle-200/60 bg-white/90 p-4 text-left shadow-lg backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <span className="animate-sway inline-block text-4xl">{program.animal_emoji}</span>
            <p className="font-display text-lg font-bold text-jungle-800">{program.name}</p>
            <p className="text-xs font-semibold text-jungle-500">{program.forest_range}</p>
            <p className="text-sm text-gray-500">{program.description}</p>
            <p className="mt-auto font-display font-bold text-jungle-700">₹{program.price} / person</p>
          </button>
        ))}
      </main>

      {selected && <BookingDialog program={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
