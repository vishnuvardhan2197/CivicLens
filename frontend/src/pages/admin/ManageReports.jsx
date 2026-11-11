import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import reportService from '../../services/reportService'
import departmentService from '../../services/departmentService'
import userService from '../../services/userService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import {
  FileText,
  Search,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Eye,
  Trash2,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

const CATEGORIES = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Water Supply',
  'Streetlights & Electricity',
  'Drainage & Sewage',
  'Public Health & Safety',
  'General Civic Issues',
]

export function ManageReports() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const initialStatus = searchParams.get('status') || 'ALL'
  const initialAssignId = searchParams.get('assignId')

  const [reports, setReports] = useState([])
  const [departments, setDepartments] = useState([])
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortByDate, setSortByDate] = useState('NEWEST')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [assignDepartmentId, setAssignDepartmentId] = useState('')
  const [assignStaffId, setAssignStaffId] = useState('')
  const [assignRemarks, setAssignRemarks] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)

  // Priority Modal State
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [targetPriority, setTargetPriority] = useState('HIGH')
  const [savingPriority, setSavingPriority] = useState(false)

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState('IN_PROGRESS')
  const [statusRemarks, setStatusRemarks] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  // Details & History Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [inspectReport, setInspectReport] = useState(null)
  const [inspectHistory, setInspectHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Open Assign Modal (stable function, no circular dependency)
  const openAssignModal = useCallback((report, customDepts) => {
    setSelectedReport(report)
    const list = customDepts || departments
    setAssignDepartmentId(report.department ? report.department.id : (list[0]?.id || ''))
    setAssignStaffId(report.assignedStaff ? report.assignedStaff.id : '')
    setAssignRemarks('')
    setAssignModalOpen(true)
  }, [departments])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Use Promise.allSettled for resilience so auxiliary endpoints do not block complaint display
      const [reportsRes, deptsRes, staffRes] = await Promise.allSettled([
        reportService.getAllReports(),
        departmentService.getAllDepartments(true),
        userService.getAllStaff(),
      ])

      let list = []
      if (reportsRes.status === 'fulfilled') {
        const reportsData = reportsRes.value
        list = reportsData?.content ? reportsData.content : Array.isArray(reportsData) ? reportsData : []
        setReports(list)
      } else {
        console.error('Failed to load complaints registry:', reportsRes.reason)
        setError('Failed to load complaints registry. Please check admin permissions or network connection.')
      }

      let depts = []
      if (deptsRes.status === 'fulfilled') {
        depts = deptsRes.value || []
        setDepartments(depts)
      } else {
        console.warn('Failed to load departments:', deptsRes.reason)
      }

      if (staffRes.status === 'fulfilled') {
        setStaffMembers(staffRes.value || [])
      } else {
        console.warn('Failed to load staff members:', staffRes.reason)
      }

      // Check if deep-linked to assign a specific report ID
      if (initialAssignId && list.length > 0) {
        const target = list.find((r) => r.id === parseInt(initialAssignId, 10))
        if (target) {
          setSelectedReport(target)
          setAssignDepartmentId(target.department ? target.department.id : (depts[0]?.id || ''))
          setAssignStaffId(target.assignedStaff ? target.assignedStaff.id : '')
          setAssignRemarks('')
          setAssignModalOpen(true)
        }
      }
    } catch (err) {
      console.error('Unexpected error loading complaints registry:', err)
      setError('An unexpected error occurred while loading complaints.')
    } finally {
      setLoading(false)
    }
  }, [initialAssignId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Open Details & History Modal
  const openDetailsModal = async (report) => {
    setInspectReport(report)
    setDetailsModalOpen(true)
    setLoadingHistory(true)
    try {
      const historyData = await reportService.getReportHistory(report.id)
      setInspectHistory(historyData || [])
    } catch (err) {
      console.error('Failed to load report history:', err)
      setInspectHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // Handle Assignment Submission
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedReport || !assignDepartmentId) return

    setSavingAssign(true)
    try {
      const payload = {
        departmentId: parseInt(assignDepartmentId, 10),
        assignedStaffId: assignStaffId ? parseInt(assignStaffId, 10) : null,
        remarks: assignRemarks.trim() || undefined,
      }

      const updated = await reportService.assignReport(selectedReport.id, payload)

      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )

      setAssignModalOpen(false)
      setSuccessMessage(`Complaint #${updated.id} successfully assigned to ${updated.department?.name}.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Assignment error:', err)
      alert(err.response?.data?.message || 'Failed to assign complaint.')
    } finally {
      setSavingAssign(false)
    }
  }

  // Open Priority Modal
  const openPriorityModal = (report) => {
    setSelectedReport(report)
    setTargetPriority(report.priority || 'MEDIUM')
    setPriorityModalOpen(true)
  }

  const handlePrioritySubmit = async (e) => {
    e.preventDefault()
    if (!selectedReport) return

    setSavingPriority(true)
    try {
      const updated = await reportService.updatePriority(selectedReport.id, targetPriority)
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
      setPriorityModalOpen(false)
      setSuccessMessage(`Priority for complaint #${updated.id} updated to ${updated.priority}.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Priority update error:', err)
      alert(err.response?.data?.message || 'Failed to update priority.')
    } finally {
      setSavingPriority(false)
    }
  }

  // Open Status Modal
  const openStatusModal = (report) => {
    setSelectedReport(report)
    setTargetStatus(report.status || 'IN_PROGRESS')
    setStatusRemarks('')
    setStatusModalOpen(true)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    if (!selectedReport) return

    setSavingStatus(true)
    try {
      const updated = await reportService.updateStatus(selectedReport.id, targetStatus, statusRemarks.trim())
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
      setStatusModalOpen(false)
      setSuccessMessage(`Status for complaint #${updated.id} updated to ${updated.status}.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Status update error:', err)
      alert(err.response?.data?.message || 'Failed to update status.')
    } finally {
      setSavingStatus(false)
    }
  }

  // Open Delete Modal
  const openDeleteModal = (report) => {
    setReportToDelete(report)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return
    setDeleting(true)
    try {
      await reportService.deleteReport(reportToDelete.id)
      setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id))
      setDeleteModalOpen(false)
      setSuccessMessage(`Complaint #${reportToDelete.id} deleted successfully.`)
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete complaint.')
    } finally {
      setDeleting(false)
    }
  }

  // Filter staff by selected department
  const filteredStaffByDept = staffMembers.filter((s) => {
    if (!assignDepartmentId) return true
    return s.department && s.department.id === parseInt(assignDepartmentId, 10)
  })

  // Filter and sort complaints
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
        const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter
        const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter
        const matchesDept =
          departmentFilter === 'ALL' ||
          (r.department && r.department.id === parseInt(departmentFilter, 10))
        const matchesSearch =
          searchTerm === '' ||
          r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.id.toString() === searchTerm.trim()

        return matchesStatus && matchesPriority && matchesCategory && matchesDept && matchesSearch
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return sortByDate === 'NEWEST' ? dateB - dateA : dateA - dateB
      })
  }, [reports, statusFilter, priorityFilter, categoryFilter, departmentFilter, searchTerm, sortByDate])

  // Pagination slicing
  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredReports.slice(start, start + pageSize)
  }, [filteredReports, currentPage, pageSize])

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Administrative Governance</span>
          <h1 className="page-title">Complaint Management Center</h1>
          <p className="page-subtitle">
            Triage incoming citizen reports, assign municipal bodies, designate officers, and govern lifecycle statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="btn btn-sm btn-outline-secondary self-start sm:self-auto flex items-center gap-1.5"
          title="Refresh complaints registry"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success mb-6">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="btn btn-sm btn-outline-danger shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="input-with-icon sm:col-span-2">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-input text-xs"
              placeholder="Search by ID, title, citizen, address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Status */}
          <div>
            <select
              className="form-input form-select text-xs"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Triage</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              className="form-input form-select text-xs"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              className="form-input form-select text-xs"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <select
              className="form-input form-select text-xs"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="ALL">All Depts</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Date Sort & Clear Filters */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Sort by Date:</span>
            <select
              className="form-input form-select py-1 text-xs"
              value={sortByDate}
              onChange={(e) => setSortByDate(e.target.value)}
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
            <span className="ml-2 font-medium text-slate-700">
              Showing {filteredReports.length} complaint{filteredReports.length !== 1 ? 's' : ''}
            </span>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || departmentFilter !== 'ALL') && (
            <button
              type="button"
              className="btn-link text-xs text-blue-600 font-semibold"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
                setCategoryFilter('ALL')
                setDepartmentFilter('ALL')
                setCurrentPage(1)
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints Table */}
      {loading ? (
        <Loading message="Loading complaints registry..." />
      ) : filteredReports.length === 0 ? (
        <div className="content-card text-center py-12">
          <FileText size={42} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No complaints found</h3>
          <p className="text-sm text-slate-500 mb-4">No records match your active query filters.</p>
        </div>
      ) : (
        <div className="content-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Citizen</th>
                  <th>Photograph</th>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Assigned Staff</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report) => (
                  <tr key={report.id}>
                    {/* ID */}
                    <td className="font-mono text-xs text-slate-500">#{report.id}</td>

                    {/* Citizen */}
                    <td>
                      <div className="font-semibold text-slate-900 text-xs">
                        {report.user?.name || 'Citizen'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {report.user?.email || 'N/A'}
                      </div>
                    </td>

                    {/* Photograph */}
                    <td className="w-16">
                      <ReportImage
                        imageUrl={report.imageUrl}
                        altText={report.title}
                        className="table-thumb"
                      />
                    </td>

                    {/* Title & Location */}
                    <td>
                      <div className="font-semibold text-slate-900 block line-clamp-1">{report.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{report.address}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="badge badge-default">{report.category}</span>
                    </td>

                    {/* Priority */}
                    <td>
                      <button
                        type="button"
                        onClick={() => openPriorityModal(report)}
                        className="hover:opacity-80 transition cursor-pointer"
                        title="Click to update priority"
                      >
                        <StatusBadge status={report.priority} type="priority" />
                      </button>
                    </td>

                    {/* Status */}
                    <td>
                      <button
                        type="button"
                        onClick={() => openStatusModal(report)}
                        className="hover:opacity-80 transition cursor-pointer"
                        title="Click to update status"
                      >
                        <StatusBadge status={report.status} />
                      </button>
                    </td>

                    {/* Department */}
                    <td className="text-xs text-slate-700">
                      {report.department ? (
                        <span className="font-medium text-slate-800">{report.department.name}</span>
                      ) : (
                        <span className="badge badge-status-pending">Unassigned</span>
                      )}
                    </td>

                    {/* Staff */}
                    <td className="text-xs text-slate-600">
                      {report.assignedStaff ? (
                        <span>{report.assignedStaff.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openDetailsModal(report)}
                          title="Inspect Details & History"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => openAssignModal(report)}
                          title="Assign Department & Staff"
                        >
                          <UserCheck size={13} />
                          <span>Assign</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openDeleteModal(report)}
                          title="Delete inappropriate or duplicate report"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
              <span className="text-slate-600">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-1 px-2"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-1 px-2"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Details & History Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Complaint Inspection: #${inspectReport?.id}`}
      >
        {inspectReport && (
          <div className="space-y-4 p-2 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  #{inspectReport.id} • {inspectReport.category}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{inspectReport.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inspectReport.status} />
                <StatusBadge status={inspectReport.priority} type="priority" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block">Citizen Submitter:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <User size={13} className="text-blue-500" />
                  {inspectReport.user?.name || 'Citizen'} ({inspectReport.user?.email})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Submission Date:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {inspectReport.createdAt ? new Date(inspectReport.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Location / Address:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-blue-500" />
                  {inspectReport.address} {inspectReport.latitude && inspectReport.longitude && `(GPS: ${inspectReport.latitude}, ${inspectReport.longitude})`}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Issue Description</span>
              <p className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200 whitespace-pre-line leading-relaxed">
                {inspectReport.description}
              </p>
            </div>

            {inspectReport.imageUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Attached Photograph</span>
                <div className="max-w-xs rounded overflow-hidden border border-slate-200">
                  <ReportImage
                    imageUrl={inspectReport.imageUrl}
                    altText={inspectReport.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              </div>
            )}

            {/* History Audit Trail */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Clock size={14} className="text-blue-600" />
                <span>Status History & Redressal Audit Trail</span>
              </span>

              {loadingHistory ? (
                <p className="text-xs text-slate-400">Loading audit history...</p>
              ) : inspectHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No status transitions logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {inspectHistory.map((step, idx) => (
                    <div key={step.id || idx} className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={step.newStatus} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          {step.timestamp ? new Date(step.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </span>
                      </div>
                      <p className="text-slate-700">{step.remarks || 'Status updated'}</p>
                      {step.changedBy && (
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          by {step.changedBy.name} ({step.changedBy.role})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                className="btn btn-outline-secondary text-xs"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Complaint #${selectedReport?.id}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 p-2">
          <div className="text-sm font-semibold text-slate-800 mb-1">
            {selectedReport?.title}
          </div>
          <p className="text-xs text-slate-500 mb-3">{selectedReport?.address}</p>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="deptSelect">
              Municipal Department <span className="text-red-500">*</span>
            </label>
            <select
              id="deptSelect"
              className="form-input form-select"
              value={assignDepartmentId}
              onChange={(e) => {
                setAssignDepartmentId(e.target.value)
                setAssignStaffId('')
              }}
              required
            >
              <option value="">-- Choose Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="staffSelect">
              Field Officer In-Charge <span className="text-xs text-slate-400 font-normal">(Filtered by Department)</span>
            </label>
            <select
              id="staffSelect"
              className="form-input form-select"
              value={assignStaffId}
              onChange={(e) => setAssignStaffId(e.target.value)}
            >
              <option value="">-- Unassigned (Department Queue Only) --</option>
              {filteredStaffByDept.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="remarks">
              Triage Remarks <span className="text-xs text-slate-400 font-normal">(Optional instruction)</span>
            </label>
            <textarea
              id="remarks"
              className="form-input form-textarea text-sm"
              rows="3"
              placeholder="e.g. Inspect road culvert and clear blockage before rainfall..."
              value={assignRemarks}
              onChange={(e) => setAssignRemarks(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setAssignModalOpen(false)}
              disabled={savingAssign}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingAssign || !assignDepartmentId}
            >
              {savingAssign ? 'Saving Assignment...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Priority Update Modal */}
      <Modal
        isOpen={priorityModalOpen}
        onClose={() => setPriorityModalOpen(false)}
        title={`Update Priority: Complaint #${selectedReport?.id}`}
      >
        <form onSubmit={handlePrioritySubmit} className="space-y-4 p-2">
          <p className="text-sm text-slate-600">
            Adjust the priority level for <strong>{selectedReport?.title}</strong>:
          </p>
          <div className="form-group">
            <label className="form-label font-semibold">Priority Level</label>
            <select
              className="form-input form-select"
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value)}
              required
            >
              <option value="LOW">Low - Routine</option>
              <option value="MEDIUM">Medium - Standard</option>
              <option value="HIGH">High - Urgent</option>
              <option value="EMERGENCY">Emergency - Immediate Hazard</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setPriorityModalOpen(false)}
              disabled={savingPriority}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPriority}
            >
              {savingPriority ? 'Updating...' : 'Update Priority'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Change Status: Complaint #${selectedReport?.id}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 p-2">
          <div className="form-group">
            <label className="form-label font-semibold">Target Status</label>
            <select
              className="form-input form-select"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              required
            >
              <option value="PENDING">PENDING</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold">Status Remarks</label>
            <textarea
              className="form-input form-textarea text-sm"
              rows="3"
              placeholder="Reason or notes regarding this status change..."
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setStatusModalOpen(false)}
              disabled={savingStatus}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingStatus}
            >
              {savingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={`Delete Complaint #${reportToDelete?.id}`}
      >
        <div className="p-2">
          <p className="text-sm text-slate-600 mb-2">
            Are you sure you want to permanently delete complaint <strong>#{reportToDelete?.id}: {reportToDelete?.title}</strong>?
          </p>
          <div className="alert alert-warning text-xs mb-4">
            This action will remove the complaint and all its associated status records permanently. Use this for inappropriate or duplicate submissions.
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
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ManageReports
