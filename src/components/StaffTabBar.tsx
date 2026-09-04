import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export function StaffTabBar() {
  const { pathname } = useLocation()
  const { profile } = useAuth()

  const tabs = [
    { to: '/admin', label: 'Dashboard', show: profile?.role === 'ADMIN' },
    { to: '/admin/programs', label: 'Manage Safaris', show: profile?.role === 'ADMIN' },
    { to: '/scan', label: 'Scan Tickets', show: true },
  ].filter((t) => t.show)

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-jungle-800 px-3 py-2 sm:px-6">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
        <Link
          to="/"
          aria-label="Go to home page"
          className="mr-1 flex shrink-0 items-center justify-center rounded-full p-2 text-jungle-100 hover:bg-white/10"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9.5 10 3l7 6.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 8v8h10V8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {tabs.map((tab) => {
          const active = pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
                active ? 'bg-white text-jungle-800' : 'text-jungle-100 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="shrink-0 rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold text-white sm:px-4"
      >
        Sign out
      </button>
    </nav>
  )
}
