import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  Sparkles,
} from 'lucide-react'

export function CitizenDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCitizenReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getMyReports()
      setReports(data || [])
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Unable to load your complaints. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCitizenReports()
  }, [fetchCitizenReports])

  // Calculate statistics from actual reports
  const total = reports.length
  const pending = reports.filter((r) => r.status === 'PENDING').length
  const assigned = reports.filter((r) => r.status === 'ASSIGNED').length
  const inProgress = reports.filter((r) => r.status === 'IN_PROGRESS').length
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length

  const recentReports = reports.slice(0, 5)

  return (
    <div className="portal-page">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="page-header-eyebrow">Citizen Portal</span>
          <h1 className="page-title">Welcome back, {user?.name || 'Citizen'}</h1>
          <p className="page-subtitle">
            Track your filed civic complaints and monitor real-time municipal redressal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link to="/citizen/map" className="btn btn-outline-primary">
            <MapPin size={16} />
            <span>View on Map</span>
          </Link>
          <Link to="/citizen/create-report" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Report an Issue</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Complaints</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <FileText size={18} />
            </div>
          </div>
          <div className="metric-value">{total}</div>
          <span className="metric-caption">All filed issues</span>
        </div>

        <div className="metric-card border-amber-200">
          <div className="metric-header">
            <span className="metric-title">Pending</span>
            <div className="metric-icon-box bg-amber-50 text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value text-amber-600">{pending}</div>
          <span className="metric-caption">Awaiting triage</span>
        </div>

        <div className="metric-card border-blue-200">
          <div className="metric-header">
            <span className="metric-title">Assigned</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="metric-value text-blue-600">{assigned}</div>
          <span className="metric-caption">Allocated to dept</span>
        </div>

        <div className="metric-card border-purple-200">
          <div className="metric-header">
            <span className="metric-title">In Progress</span>
            <div className="metric-icon-box bg-purple-50 text-purple-600">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="metric-value text-purple-600">{inProgress}</div>
          <span className="metric-caption">Under active work</span>
        </div>

        <div className="metric-card border-emerald-200 col-span-2 sm:col-span-1">
          <div className="metric-header">
            <span className="metric-title">Resolved</span>
            <div className="metric-icon-box bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value text-emerald-600">{resolved}</div>
          <span className="metric-caption">Work verified</span>
        </div>
      </div>

      {/* Action Banner */}
      <div className="action-banner">
        <div className="action-banner-content">
          <h3 className="action-banner-title">Notice a pothole, broken streetlight, or garbage pile?</h3>
          <p className="action-banner-desc">
            Take a photograph, auto-detect your location, and submit it directly to municipal officers.
          </p>
        </div>
        <Link to="/citizen/create-report" className="btn btn-action-banner">
          <PlusCircle size={18} />
          <span>Report Now</span>
        </Link>
      </div>

      {/* Recent Complaints Table */}
      <div className="content-card">
        <div className="content-card-header flex items-center justify-between">
          <div>
            <h2 className="content-card-title">Recent Complaints</h2>
            <p className="content-card-subtitle">Your latest civic grievance submissions</p>
          </div>
          {total > 0 && (
            <Link to="/citizen/my-reports" className="btn-link flex items-center gap-1 text-sm font-semibold text-blue-600">
              <span>View All ({total})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <Loading message="Loading complaints..." />
        ) : recentReports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={36} className="text-slate-300" />
            </div>
            <h3 className="empty-state-title">No complaints reported yet</h3>
            <p className="empty-state-desc">
              When you submit a complaint regarding civic infrastructure or sanitation, it will appear here.
            </p>
            <Link to="/citizen/create-report" className="btn btn-primary mt-4">
              <PlusCircle size={18} />
              <span>Submit First Complaint</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Photograph</th>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Filed</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="w-20">
                      <ReportImage
                        imageUrl={report.imageUrl}
                        altText={report.title}
                        className="table-thumb"
                      />
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800">{report.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span>{report.address || 'Location provided'}</span>
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
                    <td className="text-sm text-slate-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/citizen/reports/${report.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        <span>Details</span>
                        <ArrowRight size={14} />
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

export default CitizenDashboard
