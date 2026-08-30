import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

// Only staff sign in — regular visitors book without an account. ADMIN can scan
// tickets and view the full dashboard; TICKET_CHECKER can only scan.
export type StaffRole = 'ADMIN' | 'TICKET_CHECKER'

export interface StaffProfile {
  role: StaffRole
}

interface AuthContextValue {
  session: Session | null
  profile: StaffProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProfile(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) setProfile(null)
        return
      }
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
      if (!cancelled) setProfile(data)
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user.id)
      if (!cancelled) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession?.user.id)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ session, profile, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
