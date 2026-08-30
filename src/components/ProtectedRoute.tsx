import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  require: 'admin' | 'scanner'
}

export function ProtectedRoute({ children, require }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()

  if (loading) return <p className="p-6 text-center text-gray-500">Loading…</p>
  if (!session) return <Navigate to="/staff/login" replace />

  // ADMIN can do everything TICKET_CHECKER can (scan), plus view the dashboard.
  const allowed = require === 'admin' ? profile?.role === 'ADMIN' : profile?.role === 'ADMIN' || profile?.role === 'TICKET_CHECKER'
  if (!allowed) return <Navigate to="/staff/login" replace />

  return <>{children}</>
}
