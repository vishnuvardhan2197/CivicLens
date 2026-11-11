import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  Users,
  Building2,
  BarChart3,
  CheckSquare,
  LogOut,
  MapPin,
} from 'lucide-react'

export function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Define role-specific navigation menu items
  const citizenNav = [
    { to: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/citizen/create-report', label: 'Report an Issue', icon: PlusCircle },
    { to: '/citizen/my-reports', label: 'My Complaints', icon: FileText },
    { to: '/citizen/map', label: 'Complaints Map', icon: MapPin },
    { to: '/citizen/profile', label: 'Citizen Profile', icon: User },
  ]

  const adminNav = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/reports', label: 'All Complaints', icon: FileText },
    { to: '/admin/map', label: 'Citywide Map', icon: MapPin },
    { to: '/admin/users', label: 'Manage Users & Staff', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
  ]

  const staffNav = [
    { to: '/staff/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
    { to: '/staff/assigned-reports', label: 'Assigned Complaints', icon: CheckSquare },
    { to: '/staff/map', label: 'Field Map', icon: MapPin },
  ]

  const navItems =
    role === 'ADMIN'
      ? adminNav
      : role === 'MUNICIPAL_STAFF'
      ? staffNav
      : citizenNav

  const getPortalLabel = () => {
    if (role === 'ADMIN') return 'Administrator Portal'
    if (role === 'MUNICIPAL_STAFF') return 'Municipal Staff Portal'
    return 'Citizen Portal'
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-mobile-backdrop" onClick={onClose} />}

      <aside className={`portal-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-portal-tag">{getPortalLabel()}</span>
          {user?.department && (
            <span className="sidebar-department-tag">
              🏛️ {user.department.name}
            </span>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={18} className="sidebar-icon" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-initial">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user?.name}>
                {user?.name}
              </span>
              <span className="sidebar-user-email" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
