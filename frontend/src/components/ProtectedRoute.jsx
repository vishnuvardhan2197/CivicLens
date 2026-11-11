import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, role, getRoleDashboardPath } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading fullScreen message="Authenticating session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles) {
    const isAllowed = Array.isArray(allowedRoles)
      ? allowedRoles.includes(role)
      : role === allowedRoles

    if (!isAllowed) {
      return <Navigate to={getRoleDashboardPath(role)} replace />
    }
  }

  return children
}

export default ProtectedRoute
