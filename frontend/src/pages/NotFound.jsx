import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, Home } from 'lucide-react'

export function NotFound() {
  const { isAuthenticated, getRoleDashboardPath } = useAuth()

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <AlertTriangle size={48} className="text-amber-500" />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-desc">
          The civic portal page you requested does not exist or may have been moved.
        </p>
        <div className="not-found-actions">
          <Link
            to={isAuthenticated ? getRoleDashboardPath() : '/'}
            className="btn btn-primary"
          >
            <Home size={18} />
            <span>{isAuthenticated ? 'Return to Portal Dashboard' : 'Return to Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
