import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import ComplaintMap from '../../components/ComplaintMap'
import Loading from '../../components/Loading'
import {
  MapPin,
  Layers,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export function StaffMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getStaffAssignedReports()
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load assigned complaints for staff map:', err)
      setError('Failed to load your assigned field complaints. Please check staff authorization.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  if (loading) {
    return <Loading fullScreen message="Loading assigned field task map..." />
  }

  const geocodedCount = reports.filter(
    (r) => r.latitude !== null && r.longitude !== null && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude))
  ).length

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/staff/dashboard" className="btn-back">
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
          </div>
          <span className="page-header-eyebrow">Field Operations</span>
          <h1 className="page-title">Assigned Field Tasks Map</h1>
          <p className="page-subtitle">
            Navigate to complaint locations assigned to you or your department for on-site inspection and redressal.
          </p>
        </div>

        <Link to="/staff/assigned-reports" className="btn btn-primary self-start md:self-auto">
          <FileCheck size={16} />
          <span>Work Queue Table</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-blue-50 text-blue-600">
            <MapPin size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Plotted on Map</span>
            <div className="text-xl font-bold text-slate-800">
              {geocodedCount} <span className="text-xs font-normal text-slate-500">/ {reports.length}</span>
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-blue-50 text-blue-600">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Assigned Tasks</span>
            <div className="text-xl font-bold text-blue-600">
              {reports.filter((r) => r.status === 'ASSIGNED').length}
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-purple-50 text-purple-600">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">In Progress</span>
            <div className="text-xl font-bold text-purple-600">
              {reports.filter((r) => r.status === 'IN_PROGRESS').length}
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Completed</span>
            <div className="text-xl font-bold text-emerald-600">
              {reports.filter((r) => r.status === 'RESOLVED').length}
            </div>
          </div>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="content-card text-center py-12">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Queue is clear!</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You currently have no tasks assigned to you or your department with geographic coordinates.
          </p>
        </div>
      ) : (
        <div className="content-card p-4">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">
                Field Deployment & Route Navigation Map
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Click any pin to inspect the complaint and submit proof-of-work
            </span>
          </div>

          <ComplaintMap
            reports={reports}
            height="620px"
            viewRole="staff"
            showFilters={true}
          />
        </div>
      )}
    </div>
  )
}

export default StaffMap
