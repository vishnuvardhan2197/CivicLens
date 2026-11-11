import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import {
  CheckSquare,
  Search,
  MapPin,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

export function AssignedReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const loadAssignedQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getStaffAssignedReports()
      setReports(data || [])
    } catch (err) {
      console.error('Error fetching assigned queue:', err)
      setError('Failed to load assigned work queue. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignedQueue()
  }, [loadAssignedQueue])

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter
    const matchesSearch =
      searchTerm === '' ||
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toString() === searchTerm.trim()

    return matchesStatus && matchesPriority && matchesSearch
  })

  return (
    <div className="portal-page">
      <div className="page-header mb-6">
        <span className="page-header-eyebrow">Field Work Queue</span>
        <h1 className="page-title">Assigned Complaints</h1>
        <p className="page-subtitle">
          Municipal complaints allocated to your department and field team.
        </p>
      </div>

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
              placeholder="Search by ID, title or landmark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Newly Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              className="form-input form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <Loading message="Loading field queue..." />
      ) : filteredReports.length === 0 ? (
        <div className="content-card text-center py-12">
          <CheckSquare size={42} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No assigned complaints</h3>
          <p className="text-sm text-slate-500 mb-4">
            {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No complaints match your active filter criteria.'
              : 'There are currently no complaints assigned to your queue.'}
          </p>
          {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
              }}
            >
              Clear Filters
            </button>
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
                  <th>Complaint & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th>Date Assigned</th>
                  <th className="text-right">Action</th>
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
                        to={`/staff/reports/${report.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 block line-clamp-1"
                      >
                        {report.title}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{report.address}</span>
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
                    <td className="text-xs text-slate-700">
                      {report.assignedStaff ? (
                        <span>{report.assignedStaff.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Department Pool</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/staff/reports/${report.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <span>Manage Task</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignedReports
