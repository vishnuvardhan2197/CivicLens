import { useEffect, useState, useCallback } from 'react'
import userService from '../../services/userService'
import departmentService from '../../services/departmentService'
import StatusBadge from '../../components/StatusBadge'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Power,
  Edit2,
  Mail,
  Phone,
} from 'lucide-react'

export function ManageUsers() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Create Staff Modal State
  const [createStaffOpen, setCreateStaffOpen] = useState(false)
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    departmentId: '',
  })
  const [creatingStaff, setCreatingStaff] = useState(false)

  // Role Edit Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [targetRole, setTargetRole] = useState('CITIZEN')
  const [savingRole, setSavingRole] = useState(false)

  const loadUsersData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersData, deptsData] = await Promise.all([
        userService.getUsers(),
        departmentService.getAllDepartments(true),
      ])
      const list = usersData?.content ? usersData.content : Array.isArray(usersData) ? usersData : []
      setUsers(list)
      setDepartments(deptsData || [])
      if (deptsData?.length > 0) {
        setStaffForm((prev) => ({ ...prev, departmentId: deptsData[0].id }))
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users. Please verify admin authorization.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsersData()
  }, [loadUsersData])

  // Create staff handler
  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault()
    setCreatingStaff(true)
    setError('')
    try {
      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        phone: staffForm.phone.trim() || undefined,
        departmentId: parseInt(staffForm.departmentId, 10),
      }

      const created = await userService.createStaff(payload)
      setUsers((prev) => [created, ...prev])
      setCreateStaffOpen(false)
      setStaffForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        departmentId: departments[0]?.id || '',
      })
      setSuccessMessage(`Municipal staff member '${created.name}' provisioned successfully!`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Create staff error:', err)
      alert(err.response?.data?.message || 'Failed to create municipal staff account.')
    } finally {
      setCreatingStaff(false)
    }
  }

  // Open role modal
  const openRoleModal = (user) => {
    setSelectedUser(user)
    setTargetRole(user.role || 'CITIZEN')
    setRoleModalOpen(true)
  }

  // Role update submit
  const handleRoleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    setSavingRole(true)
    try {
      const updated = await userService.updateUserRole(selectedUser.id, targetRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      )
      setRoleModalOpen(false)
      setSuccessMessage(`User role updated to ${updated.role}.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Role update error:', err)
      alert(err.response?.data?.message || 'Failed to update user role.')
    } finally {
      setSavingRole(false)
    }
  }

  // Status toggle handler
  const handleToggleStatus = async (user) => {
    const nextStatus = !user.active
    try {
      const updated = await userService.updateUserStatus(user.id, nextStatus)
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      )
      setSuccessMessage(`User '${user.name}' is now ${nextStatus ? 'Active' : 'Inactive'}.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Status toggle error:', err)
      alert(err.response?.data?.message || 'Failed to update account status.')
    }
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' ? u.active : !u.active)
    const matchesSearch =
      searchTerm === '' ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesRole && matchesActive && matchesSearch
  })

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Personnel Directory</span>
          <h1 className="page-title">Manage Users & Municipal Staff</h1>
          <p className="page-subtitle">
            Authorize accounts, provision municipal field staff, and manage administrative privileges.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary self-start md:self-auto"
          onClick={() => setCreateStaffOpen(true)}
        >
          <UserPlus size={18} />
          <span>Add Municipal Staff</span>
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success mb-6">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="input-with-icon">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="CITIZEN">Citizens</option>
              <option value="MUNICIPAL_STAFF">Municipal Staff</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>

          <div>
            <select
              className="form-input form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loading message="Loading user directory..." />
      ) : filteredUsers.length === 0 ? (
        <div className="content-card text-center py-12">
          <Users size={42} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No users found</h3>
          <p className="text-sm text-slate-500 mb-4">No user records match your active query filters.</p>
        </div>
      ) : (
        <div className="content-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Assigned Department</th>
                  <th>Status</th>
                  <th>Date Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-400 font-mono">User ID: #{u.id}</div>
                    </td>
                    <td>
                      <div className="text-xs text-slate-700 flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone size={13} className="text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={u.role} type="role" />
                    </td>
                    <td className="text-xs text-slate-700">
                      {u.department ? (
                        <span className="font-medium text-slate-800">{u.department.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-status-resolved' : 'badge-status-rejected'}`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openRoleModal(u)}
                          title="Change Role"
                        >
                          <Edit2 size={13} />
                          <span>Role</span>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.active ? 'Deactivate user' : 'Activate user'}
                        >
                          <Power size={13} />
                          <span>{u.active ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      <Modal
        isOpen={createStaffOpen}
        onClose={() => setCreateStaffOpen(false)}
        title="Provision Municipal Staff Account"
      >
        <form onSubmit={handleCreateStaffSubmit} className="space-y-4 p-2">
          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffName">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="staffName"
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Kumar"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffEmail">
              Official Email <span className="text-red-500">*</span>
            </label>
            <input
              id="staffEmail"
              type="email"
              className="form-input"
              placeholder="ramesh.staff@civiclens.gov"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffDept">
              Assigned Municipal Department <span className="text-red-500">*</span>
            </label>
            <select
              id="staffDept"
              className="form-input form-select"
              value={staffForm.departmentId}
              onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
              required
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffPhone">
              Contact Phone <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="staffPhone"
              type="tel"
              className="form-input"
              placeholder="9876543210"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffPassword">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              id="staffPassword"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setCreateStaffOpen(false)}
              disabled={creatingStaff}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creatingStaff}
            >
              {creatingStaff ? 'Provisioning Staff...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role: ${selectedUser?.name}`}
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4 p-2">
          <p className="text-sm text-slate-600">
            Select the authorized privilege level for <strong>{selectedUser?.name}</strong>:
          </p>

          <div className="form-group">
            <label className="form-label font-semibold">Role</label>
            <select
              className="form-input form-select"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              required
            >
              <option value="CITIZEN">CITIZEN - Public Citizen Access</option>
              <option value="MUNICIPAL_STAFF">MUNICIPAL_STAFF - Field Task Access</option>
              <option value="ADMIN">ADMIN - Full Administrator Control</option>
            </select>
          </div>

          <div className="alert alert-warning text-xs">
            Demoting or deactivating the last active administrator is prevented to safeguard system integrity.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setRoleModalOpen(false)}
              disabled={savingRole}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingRole}
            >
              {savingRole ? 'Updating Role...' : 'Save Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ManageUsers
