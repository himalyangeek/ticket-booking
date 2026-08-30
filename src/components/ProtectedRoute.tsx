import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return <p className="p-6 text-center text-gray-500">Loading…</p>
  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
