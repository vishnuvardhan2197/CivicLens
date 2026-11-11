import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import StatusBadge from './StatusBadge'
import { Shield, LogOut, User as UserIcon, Menu, X, Home, PlusCircle, LayoutDashboard } from 'lucide-react'

export function Navbar({ toggleSidebar }) {
  const { user, isAuthenticated, logout, getRoleDashboardPath } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Brand Logo & Toggle for Portal Sidebar */}
        <div className="navbar-brand-section">
          {isAuthenticated && toggleSidebar && (
            <button
              type="button"
              className="navbar-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}

          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <Shield size={22} className="text-white" />
            </div>
            <div className="navbar-logo-text">
              <span className="logo-main">CivicLens</span>
              <span className="logo-sub">Municipal Governance</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav-desktop">
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/login" className="btn btn-outline-nav">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary-nav">
                Register Citizen
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to={getRoleDashboardPath()}
                className="btn-nav-dashboard"
                title="Go to Portal Dashboard"
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>

              {user?.role === 'CITIZEN' && (
                <Link
                  to="/citizen/create-report"
                  className="btn btn-accent-nav"
                >
                  <PlusCircle size={15} />
                  <span>Report Issue</span>
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Profile Pill */}
              <div className="navbar-user-pill">
                <div className="navbar-user-avatar">
                  <UserIcon size={16} />
                </div>
                <div className="navbar-user-details">
                  <span className="navbar-user-name">{user?.name}</span>
                  <StatusBadge status={user?.role} type="role" className="badge-xs" />
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
                title="Log out of CivicLens"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle for public view */}
        {!isAuthenticated && (
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile Drawer (Public) */}
      {!isAuthenticated && mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <Link
            to="/"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link
            to="/login"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserIcon size={18} />
            <span>Sign In</span>
          </Link>
          <Link
            to="/register"
            className="mobile-nav-link text-cyan-600 font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            <PlusCircle size={18} />
            <span>Register Citizen Account</span>
          </Link>
        </div>
      )}
    </header>
  )
}

export default Navbar
