import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../contexts/auth'

export function RotaProtegida() {
  const { usuario } = useAuth()
  return usuario ? <Outlet /> : <Navigate to="/login" replace />
}
