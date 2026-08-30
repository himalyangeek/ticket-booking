import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-8">
      <Link to="/" className="font-display text-lg font-extrabold text-white drop-shadow-sm">
        🌿 CG Forest Safari
      </Link>
      <div className="flex items-center gap-4 text-sm font-semibold text-jungle-100">
        <Link to="/find-ticket" className="hover:text-sunlight-400">
          Find My Ticket
        </Link>
        <Link to="/staff/login" className="hover:text-sunlight-400">
          Staff Login
        </Link>
      </div>
    </nav>
  )
}
