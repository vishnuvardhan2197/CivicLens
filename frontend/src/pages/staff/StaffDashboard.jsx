import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react'

export function StaffDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStaffQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getStaffAssignedReports()
      setReports(data || [])
    } catch (err) {
      console.error('Failed to load staff queue:', err)
      setError('Unable to load assigned work queue. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaffQueue()
  }, [loadStaffQueue])

  // Calculate staff metrics
  const total = reports.length
  const newlyAssigned = reports.filter((r) => r.status === 'ASSIGNED').length
  const inProgress = reports.filter((r) => r.status === 'IN_PROGRESS').length
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length

  const pendingActionQueue = reports
    .filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS')
    .slice(0, 5)

  return (
    <div className="portal-page">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Municipal Field Portal</span>
          <h1 className="page-title">Officer Work Queue</h1>
          <p className="page-subtitle">
            Field complaint assignments, site inspections, and resolution proof submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link to="/staff/map" className="btn btn-outline-primary">
            <MapPin size={16} />
            <span>Field Map</span>
          </Link>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
            <Building2 size={16} className="text-blue-600" />
            <span>{user?.department ? user.department.name : 'Municipal Field Office'}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="metrics-grid mb-6">
        <div className="metric-card border-blue-200">
          <div className="metric-header">
            <span className="metric-title">Total Work Queue</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="metric-value">{total}</div>
          <span className="metric-caption">All complaints assigned to you / dept</span>
        </div>

        <div className="metric-card border-amber-200">
          <div className="metric-header">
            <span className="metric-title">Awaiting Site Inspection</span>
            <div className="metric-icon-box bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value text-amber-600">{newlyAssigned}</div>
          <span className="metric-caption">Assigned; site visit pending</span>
        </div>

        <div className="metric-card border-cyan-200">
          <div className="metric-header">
            <span className="metric-title">Active In-Progress</span>
            <div className="metric-icon-box bg-cyan-50 text-cyan-600">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="metric-value text-cyan-600">{inProgress}</div>
          <span className="metric-caption">Field repairs underway</span>
        </div>

        <div className="metric-card border-emerald-200">
          <div className="metric-header">
            <span className="metric-title">Completed & Verified</span>
            <div className="metric-icon-box bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald-600">{resolved}</div>
          <span className="metric-caption">Closed with proof of work</span>
        </div>
      </div>

      {/* Priority Action Tasks Table */}
      <div className="content-card">
        <div className="content-card-header flex items-center justify-between">
          <div>
            <h2 className="content-card-title flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <span>Immediate Field Tasks</span>
            </h2>
            <p className="content-card-subtitle">
              Complaints requiring site inspection, repair progress, or resolution verification
            </p>
          </div>
          {total > 0 && (
            <Link
              to="/staff/assigned-reports"
              className="btn-link flex items-center gap-1 text-sm font-semibold text-blue-600"
            >
              <span>View Full Queue ({total})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <Loading message="Loading assigned tasks..." />
        ) : pendingActionQueue.length === 0 ? (
          <div className="empty-state py-8">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
            <h3 className="empty-state-title">No pending field tasks</h3>
            <p className="empty-state-desc">
              All assigned complaints in your queue have been inspected and resolved.
            </p>
          </div>
        ) : (
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
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingActionQueue.map((report) => (
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
                      <span className="font-semibold text-slate-900 block line-clamp-1">
                        {report.title}
                      </span>
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
                    <td className="text-xs text-slate-600">
                      {report.assignedStaff?.name || 'Department Pool'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/staff/reports/${report.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <span>Update Progress</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard
