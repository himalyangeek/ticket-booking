import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function StaffLogin() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Most staff end up at the scanner sooner or later — start downloading its
  // JS chunk now so it's warm well before they get there.
  useEffect(() => {
    void import('./Scanner')
  }, [])

  if (session && profile) {
    return <Navigate to={profile.role === 'ADMIN' ? '/admin' : '/scan'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) return setError(error.message)

    const { data: prof, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    if (profileError || !prof) {
      await supabase.auth.signOut()
      setError('This account is not authorized for staff access.')
      return
    }
    navigate(prof.role === 'ADMIN' ? '/admin' : '/scan')
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-4 rounded-2xl bg-white/95 px-6 py-8 shadow-xl backdrop-blur-sm">
        <h1 className="font-display text-2xl font-bold text-jungle-800">Staff Login</h1>
        <p className="text-sm text-gray-500">For forest department rangers and administrators only.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Email</span>
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-2 border-jungle-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Password</span>
            <input
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-2 border-jungle-200 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-jungle-500 py-2 font-display font-bold text-white disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="text-center text-sm text-jungle-600 underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
