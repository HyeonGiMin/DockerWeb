import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Gate child routes behind authentication; redirect to /login otherwise. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
