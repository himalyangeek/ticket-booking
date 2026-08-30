import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Booking from './pages/Booking'
import Home from './pages/Home'
import Login from './pages/Login'
import MyTickets from './pages/MyTickets'
import TicketDetails from './pages/TicketDetails'

// The scanner page pulls in a camera/barcode-detection library only staff need —
// code-split so regular ticket buyers never download it.
const Scanner = lazy(() => import('./pages/Scanner'))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <MyTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:ticketId"
        element={
          <ProtectedRoute>
            <TicketDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <Suspense fallback={<p className="p-6 text-center text-gray-500">Loading…</p>}>
              <Scanner />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
