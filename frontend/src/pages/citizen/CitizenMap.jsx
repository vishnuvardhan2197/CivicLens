import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import ComplaintMap from '../../components/ComplaintMap'
import Loading from '../../components/Loading'
import {
  MapPin,
  PlusCircle,
  ArrowLeft,
  AlertCircle,
  Layers,
} from 'lucide-react'

export function CitizenMap() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await reportService.getMyReports()
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load citizen complaints for map:', err)
      setError('Failed to load your complaints for map display. Please check connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  if (loading) {
    return <Loading fullScreen message="Plotting your complaints on interactive map..." />
  }

  return (
    <div className="portal-page">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/citizen/dashboard" className="btn-back">
              <ArrowLeft size={16} />
              <span>Dashboard</span>
            </Link>
          </div>
          <span className="page-header-eyebrow">Geographical Tracking</span>
          <h1 className="page-title">My Complaints Map</h1>
          <p className="page-subtitle">
            Visual map of all civic issues you have reported across your neighborhood and municipality.
          </p>
        </div>

        <Link to="/citizen/create-report" className="btn btn-primary self-start md:self-auto">
          <PlusCircle size={18} />
          <span>Report New Issue</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="content-card text-center py-12">
          <MapPin size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">No complaints filed yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            You haven't submitted any civic complaints yet. Once you submit complaints with GPS coordinates, they will be plotted here.
          </p>
          <Link to="/citizen/create-report" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Submit Your First Report</span>
          </Link>
        </div>
      ) : (
        <div className="content-card p-4">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-800 text-sm">
                Interactive Neighborhood Complaint Map
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Total Reports Filed: <strong>{reports.length}</strong>
            </span>
          </div>

          <ComplaintMap
            reports={reports}
            height="620px"
            viewRole="citizen"
            showFilters={true}
          />
        </div>
      )}
    </div>
  )
}

export default CitizenMap
