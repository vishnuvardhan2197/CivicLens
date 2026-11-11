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
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react'

export function AdminMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getAllReports()
      const list = data?.content ? data.content : Array.isArray(data) ? data : []
      setReports(list)
    } catch (err) {
      console.error('Failed to load all complaints for admin map:', err)
      setError('Failed to load civic reports. Please verify administrative privileges.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  if (loading) {
    return <Loading fullScreen message="Loading city-wide geographic complaint data..." />
  }

  const geocodedCount = reports.filter(
    (r) => r.latitude !== null && r.longitude !== null && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude))
  ).length

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/dashboard" className="btn-back">
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
          </div>
          <span className="page-header-eyebrow">Municipal GIS Intelligence</span>
          <h1 className="page-title">Citywide Complaints Map</h1>
          <p className="page-subtitle">
            Geographic distribution of citizen issues across wards, districts, and department jurisdictions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link to="/admin/reports" className="btn btn-outline-primary">
            <FileText size={16} />
            <span>Complaint Registry</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Strip */}
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
          <div className="stat-subcard-icon bg-amber-50 text-amber-600">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Pending Triage</span>
            <div className="text-xl font-bold text-amber-600">
              {reports.filter((r) => r.status === 'PENDING').length}
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-purple-50 text-purple-600">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Under Redressal</span>
            <div className="text-xl font-bold text-purple-600">
              {reports.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length}
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Resolved</span>
            <div className="text-xl font-bold text-emerald-600">
              {reports.filter((r) => r.status === 'RESOLVED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="content-card p-4">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Live Municipal Spatial Operations Center
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click any pin to inspect details or initiate administrative triage
          </span>
        </div>

        <ComplaintMap
          reports={reports}
          height="640px"
          viewRole="admin"
          showFilters={true}
        />
      </div>
    </div>
  )
}

export default AdminMap
