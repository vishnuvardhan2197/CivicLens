import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import ComplaintMap from '../../components/ComplaintMap'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Check,
} from 'lucide-react'

export function ReportDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchDetails = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reportData, historyData] = await Promise.all([
        reportService.getReportById(id),
        reportService.getReportHistory(id),
      ])
      setReport(reportData)
      setHistory(historyData || [])
    } catch (err) {
      console.error('Failed to load report details:', err)
      setError('Complaint not found or you do not have permission to view it.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await reportService.deleteReport(id)
      navigate('/citizen/my-reports')
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete complaint.')
      setDeleting(false)
    }
  }

  if (loading) {
    return <Loading fullScreen message="Loading complaint details..." />
  }

  if (error || !report) {
    return (
      <div className="portal-page max-w-xl mx-auto py-12 text-center">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Complaint Unavailable</h2>
        <p className="text-slate-600 mb-6">{error || 'Unable to retrieve complaint.'}</p>
        <Link to="/citizen/my-reports" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Back to My Reports</span>
        </Link>
      </div>
    )
  }

  const googleMapsUrl =
    report.latitude && report.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
      : null

  return (
    <div className="portal-page max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/citizen/my-reports" className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Complaints</span>
        </Link>

        {report.status === 'PENDING' && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash2 size={14} />
            <span>Delete Complaint</span>
          </button>
        )}
      </div>

      {/* Visual Complaint Progress Stepper */}
      <div className="content-card mb-6 py-5 px-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-4">
          Redressal Progress Lifecycle
        </span>
        <div className="progress-stepper">
          {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', report.status === 'REJECTED' ? 'REJECTED' : 'RESOLVED'].map(
            (step, idx) => {
              const statusOrder = {
                PENDING: 0,
                ASSIGNED: 1,
                IN_PROGRESS: 2,
                RESOLVED: 3,
                REJECTED: 3,
              }
              const currentStepIdx = statusOrder[report.status] ?? 0
              const isCompleted = idx < currentStepIdx || (idx === currentStepIdx && report.status === 'RESOLVED')
              const isCurrent = idx === currentStepIdx && report.status !== 'RESOLVED'
              const isRejected = step === 'REJECTED' && report.status === 'REJECTED'

              return (
                <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''} ${isRejected ? 'rejected' : ''}`}>
                  <div className="step-marker">
                    {isCompleted ? <Check size={14} /> : idx + 1}
                  </div>
                  <span className="step-label">
                    {step === 'SUBMITTED' ? 'Submitted' : step === 'ASSIGNED' ? 'Assigned' : step === 'IN_PROGRESS' ? 'In Progress' : isRejected ? 'Rejected' : 'Resolved'}
                  </span>
                  {idx < 3 && <div className="step-connector" />}
                </div>
              )
            }
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="content-card mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                COMPLAINT #{report.id}
              </span>
              <StatusBadge status={report.status} />
              <StatusBadge status={report.priority} type="priority" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
            <span className="badge badge-default mt-2 inline-block">{report.category}</span>
          </div>

          <div className="text-left md:text-right shrink-0">
            <div className="text-xs text-slate-500 flex items-center md:justify-end gap-1">
              <Calendar size={13} />
              <span>
                Filed:{' '}
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'N/A'}
              </span>
            </div>
            {report.resolvedAt && (
              <div className="text-xs text-emerald-600 font-medium flex items-center md:justify-end gap-1 mt-1">
                <CheckCircle2 size={13} />
                <span>
                  Resolved:{' '}
                  {new Date(report.resolvedAt).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-5">
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
              {report.description}
            </p>

            <h3 className="text-sm font-semibold text-slate-800 mt-5 mb-2">Location & Address</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
              <div className="flex items-start gap-2 text-slate-800 font-medium">
                <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{report.address || 'Address not specified'}</span>
              </div>
              {report.latitude && report.longitude && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 flex items-center justify-between mb-2">
                    <span>GPS: {report.latitude}, {report.longitude}</span>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  {/* Embedded Leaflet Map */}
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <ComplaintMap
                      reports={[report]}
                      height="220px"
                      showFilters={false}
                      viewRole="citizen"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complaint Photograph */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Attached Photograph</h3>
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <ReportImage
                imageUrl={report.imageUrl}
                altText={report.title}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Department & Staff Assignment Box */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Assigned Department</span>
              <span className="text-sm font-semibold text-slate-800">
                {report.department ? report.department.name : 'Awaiting Triage'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Field Officer In-Charge</span>
              <span className="text-sm font-semibold text-slate-800">
                {report.assignedStaff ? report.assignedStaff.name : 'Pending Officer Assignment'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Milestone & Proof of Work (if resolved) */}
      {report.status === 'RESOLVED' && (
        <div className="content-card border-emerald-200 bg-emerald-50/30 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Proof of Resolution</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            This issue has been marked resolved by municipal field officers.
          </p>

          {history.length > 0 && history[0].proofImageUrl && (
            <div className="max-w-sm rounded-lg overflow-hidden border border-emerald-200 mb-3">
              <ReportImage
                imageUrl={history[0].proofImageUrl}
                altText="Proof of resolution"
                className="w-full h-52 object-cover"
              />
            </div>
          )}

          {history.length > 0 && history[0].remarks && (
            <div className="text-sm bg-white p-3 rounded border border-emerald-200 text-slate-700">
              <strong>Staff Remarks:</strong> {history[0].remarks}
            </div>
          )}
        </div>
      )}

      {/* Timeline Audit History */}
      <div className="content-card">
        <h3 className="content-card-title mb-1 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          <span>Resolution Timeline & Audit Trail</span>
        </h3>
        <p className="content-card-subtitle mb-6">
          Immutable log of all status transitions, triage events, and remarks.
        </p>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">No status history logged yet.</p>
        ) : (
          <div className="timeline">
            {history.map((step, idx) => (
              <div key={step.id || idx} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-dot" />
                  {idx < history.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400 font-mono">
                      {step.timestamp
                        ? new Date(step.timestamp).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : ''}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <StatusBadge status={step.newStatus} />
                    {step.changedBy && (
                      <span className="text-xs text-slate-500">
                        by <strong>{step.changedBy.name}</strong> ({step.changedBy.role})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {step.remarks || 'Status updated'}
                  </p>
                  {step.proofImageUrl && (
                    <div className="mt-2 max-w-xs">
                      <ReportImage
                        imageUrl={step.proofImageUrl}
                        altText="Proof photograph"
                        className="w-40 h-28 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="p-2">
          <p className="text-sm text-slate-600 mb-4">
            Are you sure you want to delete this pending complaint? This action cannot be reversed.
          </p>
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
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ReportDetails
