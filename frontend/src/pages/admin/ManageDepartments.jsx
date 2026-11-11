import { useEffect, useState, useCallback } from 'react'
import departmentService from '../../services/departmentService'
import analyticsService from '../../services/analyticsService'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react'

export function ManageDepartments() {
  const [departments, setDepartments] = useState([])
  const [workloads, setWorkloads] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)

  // Add/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDeptId, setSelectedDeptId] = useState(null)
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deptToDelete, setDeptToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, workloadsData] = await Promise.all([
        departmentService.getAllDepartments(activeOnly),
        analyticsService.getDepartments().catch(() => []),
      ])
      setDepartments(data || [])
      const map = {}
      if (Array.isArray(workloadsData)) {
        workloadsData.forEach((w) => {
          map[w.department || w.departmentName] = w.count
        })
      }
      setWorkloads(map)
    } catch (err) {
      console.error('Failed to load departments:', err)
      setError('Failed to load municipal departments. Please verify admin privileges.')
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const openAddModal = () => {
    setIsEditing(false)
    setSelectedDeptId(null)
    setDeptForm({
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      active: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (dept) => {
    setIsEditing(true)
    setSelectedDeptId(dept.id)
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      active: dept.active ?? true,
    })
    setModalOpen(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEditing) {
        const updated = await departmentService.updateDepartment(selectedDeptId, deptForm)
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        )
        setSuccessMessage(`Department '${updated.name}' updated successfully.`)
      } else {
        const created = await departmentService.createDepartment(deptForm)
        setDepartments((prev) => [...prev, created])
        setSuccessMessage(`Department '${created.name}' created successfully.`)
      }
      setModalOpen(false)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Department save error:', err)
      alert(err.response?.data?.message || 'Failed to save department.')
    } finally {
      setSaving(false)
    }
  }

  const openDeleteModal = (dept) => {
    setDeptToDelete(dept)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return
    setDeleting(true)
    try {
      const res = await departmentService.deleteDepartment(deptToDelete.id)
      const message = res?.data || res?.message || 'Department processed successfully.'
      setSuccessMessage(message)
      setDeleteModalOpen(false)
      loadDepartments()
      setTimeout(() => setSuccessMessage(''), 6000)
    } catch (err) {
      console.error('Department delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete/deactivate department.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Municipal Infrastructure</span>
          <h1 className="page-title">Manage Municipal Departments</h1>
          <p className="page-subtitle">
            Configure civic service bodies, public emergency helplines, and field routing assignments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary self-start md:self-auto"
          onClick={openAddModal}
        >
          <PlusCircle size={18} />
          <span>Add Department</span>
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

      {/* Filter Bar */}
      <div className="filter-card mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          Total Registered Bodies: {departments.length}
        </span>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Show Active Only</span>
        </label>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <Loading message="Loading municipal departments..." />
      ) : departments.length === 0 ? (
        <div className="content-card text-center py-12">
          <Building2 size={42} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No departments configured</h3>
          <p className="text-sm text-slate-500 mb-4">Click below to add your first municipal department.</p>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <PlusCircle size={18} />
            <span>Add Department</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className="content-card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{dept.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">ID: #{dept.id}</span>
                    </div>
                  </div>
                  <span className={`badge ${dept.active ? 'badge-status-resolved' : 'badge-status-rejected'}`}>
                    {dept.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-3 min-h-[40px]">
                  {dept.description || 'No description provided.'}
                </p>

                {/* Complaint Workload Badge */}
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg mb-3">
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} className="text-blue-500" />
                    <span>Active Workload:</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {workloads[dept.name] || 0} complaint{(workloads[dept.name] || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600 mb-4">
                  {dept.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-blue-500" />
                      <span>{dept.contactPhone}</span>
                    </div>
                  )}
                  {dept.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-blue-500" />
                      <span>{dept.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => openEditModal(dept)}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => openDeleteModal(dept)}
                  title="Delete or safely deactivate"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? `Edit Department: ${deptForm.name}` : 'Create Municipal Department'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 p-2">
          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="deptName">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="deptName"
              type="text"
              className="form-input"
              placeholder="e.g. Roads & Infrastructure"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="deptDesc">
              Description & Jurisdiction
            </label>
            <textarea
              id="deptDesc"
              rows="3"
              className="form-input form-textarea text-sm"
              placeholder="Describe the department's responsibilities..."
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label font-semibold" htmlFor="deptEmail">
                Helpline Email
              </label>
              <input
                id="deptEmail"
                type="email"
                className="form-input text-sm"
                placeholder="roads@civiclens.gov"
                value={deptForm.contactEmail}
                onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label font-semibold" htmlFor="deptPhone">
                Emergency Phone
              </label>
              <input
                id="deptPhone"
                type="text"
                className="form-input text-sm"
                placeholder="1800-111-001"
                value={deptForm.contactPhone}
                onChange={(e) => setDeptForm({ ...deptForm, contactPhone: e.target.value })}
              />
            </div>
          </div>

          {isEditing && (
            <label className="flex items-center gap-2 cursor-pointer pt-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={deptForm.active}
                onChange={(e) => setDeptForm({ ...deptForm, active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-medium">Active Department</span>
            </label>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Department"
      >
        <div className="p-2">
          <p className="text-sm text-slate-600 mb-3">
            Are you sure you want to remove <strong>{deptToDelete?.name}</strong>?
          </p>
          <div className="alert alert-warning text-xs mb-4 leading-relaxed">
            <strong>Referential Integrity Protection:</strong> If any active or historical complaints reference this department, it will be automatically <em>deactivated</em> instead of deleted to protect civic records.
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Processing...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ManageDepartments
