import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import FindTicket from './pages/FindTicket'
import Home from './pages/Home'
import StaffLogin from './pages/StaffLogin'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminPrograms = lazy(() => import('./pages/AdminPrograms'))
// The scanner page pulls in a camera/barcode-detection library only staff need —
// code-split so regular visitors never download it.
const Scanner = lazy(() => import('./pages/Scanner'))

const loadingFallback = <p className="p-6 text-center text-gray-500">Loading…</p>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/find-ticket" element={<FindTicket />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute require="admin">
            <Suspense fallback={loadingFallback}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <ProtectedRoute require="admin">
            <Suspense fallback={loadingFallback}>
              <AdminPrograms />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute require="scanner">
            <Suspense fallback={loadingFallback}>
              <Scanner />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
