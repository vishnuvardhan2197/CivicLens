import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Trash2,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getMyReports()
      setReports(data || [])
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Failed to load your complaints. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleDeleteClick = (report) => {
    setReportToDelete(report)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return
    setDeleting(true)
    try {
      await reportService.deleteReport(reportToDelete.id)
      setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id))
      setDeleteModalOpen(false)
      setReportToDelete(null)
      setDeleteMessage('Complaint deleted successfully.')
      setTimeout(() => setDeleteMessage(''), 4000)
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete complaint.')
    } finally {
      setDeleting(false)
    }
  }

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || r.status === statusFilter

    const matchesCategory =
      categoryFilter === 'ALL' || r.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Extract unique categories for filter
  const categories = ['ALL', ...new Set(reports.map((r) => r.category).filter(Boolean))]

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Grievance History</span>
          <h1 className="page-title">My Filed Complaints</h1>
          <p className="page-subtitle">
            Review and track all civic issues you have reported to municipal authorities.
          </p>
        </div>

        <Link to="/citizen/create-report" className="btn btn-primary self-start md:self-auto">
          <PlusCircle size={18} />
          <span>Report New Issue</span>
        </Link>
      </div>

      {deleteMessage && (
        <div className="alert alert-success mb-6">
          <CheckCircle2 size={18} />
          <span>{deleteMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="input-with-icon">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, landmark or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select
              className="form-input form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              className="form-input form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <Loading message="Loading complaints list..." />
      ) : filteredReports.length === 0 ? (
        <div className="content-card text-center py-12">
          <FileText size={42} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No complaints found</h3>
          <p className="text-sm text-slate-500 mb-4">
            {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No complaints match your active filter criteria.'
              : 'You have not submitted any civic complaints yet.'}
          </p>
          {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setCategoryFilter('ALL')
              }}
            >
              Reset Filters
            </button>
          ) : (
            <Link to="/citizen/create-report" className="btn btn-primary">
              <PlusCircle size={18} />
              <span>Report Your First Issue</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="content-card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Photograph</th>
                  <th>Complaint Title & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Date Filed</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="font-mono text-xs text-slate-500">#{report.id}</td>
                    <td className="w-16">
                      <ReportImage
                        imageUrl={report.imageUrl}
                        altText={report.title}
                        className="table-thumb"
                      />
                    </td>
                    <td>
                      <Link
                        to={`/citizen/reports/${report.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1"
                      >
                        {report.title}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{report.address || 'Location provided'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-default">{report.category}</span>
                    </td>
                    <td>
                      <StatusBadge status={report.priority} type="priority" />
                    </td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="text-xs text-slate-600">
                      {report.department ? report.department.name : <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/citizen/reports/${report.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="View Details"
                        >
                          <span>Details</span>
                        </Link>
                        {report.status === 'PENDING' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteClick(report)}
                            title="Delete pending complaint"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Pending Report */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Complaint Deletion"
      >
        <div className="p-2">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to delete complaint <strong className="text-slate-800">#{reportToDelete?.id} - "{reportToDelete?.title}"</strong>?
          </p>
          <div className="alert alert-warning text-xs mb-4">
            Citizens can only delete complaints while their status is PENDING. This action cannot be undone.
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
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Complaint'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MyReports
