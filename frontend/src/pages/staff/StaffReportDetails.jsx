import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import ComplaintMap from '../../components/ComplaintMap'
import Loading from '../../components/Loading'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Camera,
  FileCheck,
  Send,
  Check,
} from 'lucide-react'

export function StaffReportDetails() {
  const { id } = useParams()

  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Progress update form state
  const [status, setStatus] = useState('IN_PROGRESS')
  const [remarks, setRemarks] = useState('')
  const [notes, setNotes] = useState('')
  const [submittingUpdate, setSubmittingUpdate] = useState(false)

  // Proof photograph upload state
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const proofInputRef = useRef(null)

  const loadDetails = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reportData, historyData] = await Promise.all([
        reportService.getStaffReportById(id),
        reportService.getReportHistory(id),
      ])
      setReport(reportData)
      setHistory(historyData || [])
      setStatus(reportData.status === 'ASSIGNED' ? 'IN_PROGRESS' : reportData.status)
    } catch (err) {
      console.error('Failed to load staff complaint:', err)
      setError('Complaint not found or not assigned to your department.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  // Handle proof photograph upload
  const handleProofChange = async (file) => {
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Proof image exceeds the 5 MB limit.')
      return
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      alert('Only JPEG, PNG, and WebP images are permitted for proof.')
      return
    }

    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
    setUploadingProof(true)

    try {
      const res = await reportService.uploadImage(file)
      if (res.imageUrl) {
        setProofImageUrl(res.imageUrl)
      }
    } catch (err) {
      console.error('Proof upload failed:', err)
      alert('Failed to upload proof photograph.')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleRemoveProof = () => {
    setProofFile(null)
    setProofPreview('')
    setProofImageUrl('')
    if (proofInputRef.current) {
      proofInputRef.current.value = ''
    }
  }

  // Handle status update submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!remarks.trim()) {
      alert('Please enter remarks detailing the work performed.')
      return
    }

    setSubmittingUpdate(true)
    try {
      const payload = {
        status,
        remarks: remarks.trim(),
        proofImageUrl: proofImageUrl || undefined,
        notes: notes.trim() || undefined,
      }

      const updated = await reportService.updateStaffProgress(id, payload)
      setReport(updated)

      // Refresh history
      const historyData = await reportService.getReportHistory(id)
      setHistory(historyData || [])

      setSuccessMessage(`Complaint #${id} updated to ${updated.status} successfully!`)
      setRemarks('')
      setNotes('')
      handleRemoveProof()
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Failed to update complaint:', err)
      alert(err.response?.data?.message || 'Failed to submit field update.')
    } finally {
      setSubmittingUpdate(false)
    }
  }

  if (loading) {
    return <Loading fullScreen message="Loading assigned complaint details..." />
  }

  if (error || !report) {
    return (
      <div className="portal-page max-w-xl mx-auto py-12 text-center">
        <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Complaint Unavailable</h2>
        <p className="text-slate-600 mb-6">{error || 'Unable to retrieve complaint.'}</p>
        <Link to="/staff/assigned-reports" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Back to Work Queue</span>
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
        <Link to="/staff/assigned-reports" className="btn-back">
          <ArrowLeft size={16} />
          <span>Back to Work Queue</span>
        </Link>
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

      {successMessage && (
        <div className="alert alert-success mb-6">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="content-card mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                TASK #{report.id}
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
                Assigned:{' '}
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
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Citizen Complaint Description</h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200">
              {report.description}
            </p>

            <h3 className="text-sm font-semibold text-slate-800 mt-5 mb-2">Site Location</h3>
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
                        <span>Navigate via Google Maps</span>
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
                      viewRole="staff"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Citizen's Uploaded Complaint Photograph */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Citizen's Photograph</h3>
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <ReportImage
                imageUrl={report.imageUrl}
                altText={report.title}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        </div>

        {/* Department Info */}
        <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Department & Officer</span>
            <span className="text-sm font-semibold text-slate-800">
              {report.department?.name || 'Department Pool'} • Officer: {report.assignedStaff?.name || 'Assigned to team'}
            </span>
          </div>
        </div>
      </div>

      {/* Field Action & Proof-of-Work Form */}
      <form onSubmit={handleUpdateSubmit} className="content-card border-blue-200 mb-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <FileCheck size={20} className="text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Field Progress & Proof Submission</h3>
            <p className="text-xs text-slate-500">Record inspection remarks, advance status, and upload resolution photographs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="fieldStatus">
              Update Status <span className="text-red-500">*</span>
            </label>
            <select
              id="fieldStatus"
              className="form-input form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="IN_PROGRESS">IN_PROGRESS - Work/Inspection Underway</option>
              <option value="RESOLVED">RESOLVED - Task Completed with Proof</option>
              <option value="REJECTED">REJECTED - Duplicate or Out of Scope</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="fieldNotes">
              Internal Field Notes <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="fieldNotes"
              type="text"
              className="form-input"
              placeholder="e.g. Work crew of 4 deployed with road roller"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group mb-4">
          <label className="form-label font-semibold" htmlFor="fieldRemarks">
            Work Remarks / Redressal Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            id="fieldRemarks"
            rows="3"
            className="form-input form-textarea text-sm"
            placeholder="Detailed description of field actions taken, materials used, or resolution status..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            required
          />
        </div>

        {/* Proof Photograph Upload */}
        <div className="form-group mb-5">
          <label className="form-label font-semibold">
            Attach Proof-of-Work Photograph <span className="text-xs text-slate-400 font-normal">(Required for verified resolution)</span>
          </label>

          <input
            type="file"
            ref={proofInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleProofChange(e.target.files[0])}
          />

          {!proofPreview ? (
            <div
              className={`upload-dropzone p-4 ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                if (e.dataTransfer.files?.[0]) handleProofChange(e.dataTransfer.files[0])
              }}
              onClick={() => proofInputRef.current?.click()}
            >
              <Camera size={24} className="text-blue-500 mx-auto mb-1" />
              <span className="text-xs font-semibold text-slate-700 block">
                Click to upload field resolution proof photograph
              </span>
              <span className="text-[11px] text-slate-400">Max 5 MB (JPEG, PNG, WebP)</span>
            </div>
          ) : (
            <div className="image-preview-card">
              <img src={proofPreview} alt="Proof preview" className="image-preview-thumb" />
              <div className="image-preview-meta">
                <span className="font-semibold text-slate-800 text-sm">
                  {proofFile ? proofFile.name : 'Proof photograph'}
                </span>
                <span className="text-xs text-slate-500">
                  {uploadingProof ? 'Uploading proof image...' : proofImageUrl ? 'Uploaded successfully' : ''}
                </span>
              </div>
              <button
                type="button"
                className="btn-remove-image"
                onClick={handleRemoveProof}
                title="Remove proof"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingUpdate || uploadingProof}
          >
            {submittingUpdate ? (
              <span>Saving Progress...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={16} />
                <span>Submit Field Update</span>
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Resolution Timeline */}
      <div className="content-card">
        <h3 className="content-card-title mb-1 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          <span>Task History Audit Trail</span>
        </h3>
        <p className="content-card-subtitle mb-4">Complete log of assignments and field status transitions</p>

        {history.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">No history recorded yet.</p>
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
    </div>
  )
}

export default StaffReportDetails
