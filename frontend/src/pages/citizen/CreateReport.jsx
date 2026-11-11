import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import reportService from '../../services/reportService'
import ComplaintMap from '../../components/ComplaintMap'
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  ArrowRight,
  Map,
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

const PRIORITIES = [
  { value: 'LOW', label: 'Low - Routine maintenance' },
  { value: 'MEDIUM', label: 'Medium - Requires prompt attention' },
  { value: 'HIGH', label: 'High - Urgent civic hazard' },
  { value: 'EMERGENCY', label: 'Emergency - Immediate safety risk' },
]

export function CreateReport() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Roads & Infrastructure',
    priority: 'MEDIUM',
    address: '',
    latitude: '',
    longitude: '',
    imageUrl: '',
  })

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Form field refs for targeted focus
  const titleInputRef = useRef(null)
  const addressInputRef = useRef(null)
  const descriptionInputRef = useRef(null)

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({})

  // Geolocation state
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [locationSuccess, setLocationSuccess] = useState('')
  const [showMapPicker, setShowMapPicker] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successReport, setSuccessReport] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
    setError('')
  }

  // Geolocation detection with progressive fallback
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please select your location on the map or enter coordinates manually.')
      return
    }

    setDetectingLocation(true)
    setLocationSuccess('')
    setError('')

    const onGeoSuccess = (position) => {
      const lat = Number(position.coords.latitude.toFixed(6))
      const lng = Number(position.coords.longitude.toFixed(6))
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
        // If address is currently empty, pre-populate with GPS coordinate tag to ensure form is ready
        address: prev.address.trim() ? prev.address : `Location near (${lat}, ${lng})`,
      }))
      setFieldErrors((prev) => ({
        ...prev,
        address: '',
        latitude: '',
        longitude: '',
      }))
      setLocationSuccess(`GPS location detected: ${lat}, ${lng}`)
      setDetectingLocation(false)
    }

    const onLowAccuracyFallback = () => {
      navigator.geolocation.getCurrentPosition(
        onGeoSuccess,
        (err) => {
          console.error('Low accuracy geolocation error:', err)
          setDetectingLocation(false)
          if (err.code === 1) { // PERMISSION_DENIED
            setError('Location permission was denied. Please allow location access in your browser or click "Pick on Map".')
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            setError('GPS position is currently unavailable from your device or network. Please click "Pick on Map" to choose your location.')
          } else if (err.code === 3) { // TIMEOUT
            setError('GPS request timed out. Please click "Pick on Map" to choose your location on the interactive map.')
          } else {
            setError('Unable to retrieve your location automatically. Please use "Pick on Map" or enter the address manually.')
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
      )
    }

    // First attempt: High accuracy (fast GPS/Wi-Fi fix)
    navigator.geolocation.getCurrentPosition(
      onGeoSuccess,
      (err) => {
        // If permission was explicitly denied, do not retry
        if (err.code === 1) {
          console.warn('Geolocation permission denied:', err)
          setError('Location permission was denied. Please allow location access in your browser or click "Pick on Map".')
          setDetectingLocation(false)
          return
        }
        // If timed out or unavailable, automatically try standard accuracy
        console.warn('High accuracy geolocation timed out or unavailable, falling back to standard accuracy...', err)
        onLowAccuracyFallback()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // File selection handling
  const handleFileChange = async (file) => {
    if (!file) return

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds the 5 MB maximum size limit.')
      return
    }

    // Extension check
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.')
      return
    }

    setError('')
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))

    // Automatically upload image to get permanent URL
    setUploadingImage(true)
    try {
      const result = await reportService.uploadImage(file)
      if (result.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result.imageUrl,
        }))
      }
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Failed to upload image. Please check file format and try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview('')
    setFormData((prev) => ({ ...prev, imageUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const errors = {}

    const trimmedTitle = formData.title.trim()
    if (!trimmedTitle) {
      errors.title = 'Complaint title is required.'
    } else if (trimmedTitle.length < 5) {
      errors.title = 'Title must be at least 5 characters long.'
    }

    const trimmedAddress = formData.address.trim()
    if (!trimmedAddress) {
      errors.address = 'Please provide an address, landmark, or street name.'
    }

    const trimmedDesc = formData.description.trim()
    if (!trimmedDesc) {
      errors.description = 'Please provide a detailed description of the issue.'
    } else if (trimmedDesc.length < 10) {
      errors.description = 'Description should be at least 10 characters long to help municipal staff.'
    }

    if (formData.latitude) {
      const latNum = parseFloat(formData.latitude)
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.latitude = 'Latitude must be a valid number between -90 and 90.'
      }
    }

    if (formData.longitude) {
      const lngNum = parseFloat(formData.longitude)
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.longitude = 'Longitude must be a valid number between -180 and 180.'
      }
    }

    if (uploadingImage) {
      setError('Please wait for the photograph upload to finish before submitting.')
      return
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please complete all required fields highlighted below.')
      // Automatically focus first invalid field
      if (errors.title && titleInputRef.current) {
        titleInputRef.current.focus()
      } else if (errors.address && addressInputRef.current) {
        addressInputRef.current.focus()
      } else if (errors.description && descriptionInputRef.current) {
        descriptionInputRef.current.focus()
      }
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        title: trimmedTitle,
        description: trimmedDesc,
        category: formData.category,
        priority: formData.priority,
        address: trimmedAddress,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        imageUrl: formData.imageUrl || null,
      }

      const created = await reportService.createReport(payload)
      setSuccessReport(created)
    } catch (err) {
      console.error('Submission error:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Failed to submit complaint. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (successReport) {
    return (
      <div className="portal-page max-w-2xl mx-auto">
        <div className="content-card text-center py-10 px-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Complaint Submitted Successfully!</h2>
          <p className="text-slate-600 mb-4">
            Your complaint has been registered with ID <strong className="text-blue-600">#{successReport.id}</strong>.
            A confirmation notification has been sent to your account.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left mb-6 max-w-md mx-auto">
            <div className="text-sm font-semibold text-slate-800">{successReport.title}</div>
            <div className="text-xs text-slate-500 mt-1">Category: {successReport.category}</div>
            <div className="text-xs text-slate-500 mt-0.5">Priority: {successReport.priority}</div>
            <div className="text-xs text-slate-500 mt-0.5">Status: <span className="font-semibold text-amber-600">{successReport.status}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/citizen/reports/${successReport.id}`} className="btn btn-primary">
              <span>View Complaint Details</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/citizen/my-reports" className="btn btn-outline-primary">
              <span>Back to My Reports</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-page max-w-3xl mx-auto">
      <div className="page-header mb-6">
        <Link to="/citizen/dashboard" className="btn-back mb-2">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="page-title">Report a Civic Issue</h1>
        <p className="page-subtitle">
          Submit details, photographs, and GPS location of infrastructure issues to municipal authorities.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="content-card">
        {/* Title */}
        <div className="form-group mb-5">
          <label className="form-label font-semibold" htmlFor="title">
            Complaint Title <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            id="title"
            name="title"
            type="text"
            className={`form-input ${fieldErrors.title ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200' : ''}`}
            placeholder="e.g. Hazardous deep pothole on MG Road near Metro Pillar 42"
            value={formData.title}
            onChange={handleChange}
          />
          {fieldErrors.title && (
            <span className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={13} />
              <span>{fieldErrors.title}</span>
            </span>
          )}
        </div>

        {/* Category & Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="category">
              Civic Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              className="form-input form-select"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label font-semibold" htmlFor="priority">
              Perceived Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              className="form-input form-select"
              value={formData.priority}
              onChange={handleChange}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address / Landmark */}
        <div className="form-group mb-5">
          <label className="form-label font-semibold" htmlFor="address">
            Address or Landmark <span className="text-red-500">*</span>
          </label>
          <input
            ref={addressInputRef}
            id="address"
            name="address"
            type="text"
            className={`form-input ${fieldErrors.address ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200' : ''}`}
            placeholder="e.g. Opposite City Hospital Gate 2, Cross Road 4, Ward 12"
            value={formData.address}
            onChange={handleChange}
          />
          {fieldErrors.address && (
            <span className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={13} />
              <span>{fieldErrors.address}</span>
            </span>
          )}
        </div>

        {/* GPS Geolocation Row */}
        <div className="form-group mb-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Navigation size={16} className="text-blue-600" />
                <span>GPS & Map Location Tagging</span>
              </span>
              <p className="text-xs text-slate-500">
                Pinpoint the exact spot using GPS or select on the interactive map.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
              >
                <Navigation size={14} className={detectingLocation ? 'animate-spin' : ''} />
                <span>{detectingLocation ? 'Locating...' : 'Detect GPS'}</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${showMapPicker ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowMapPicker(!showMapPicker)}
              >
                <Map size={14} />
                <span>{showMapPicker ? 'Hide Map' : 'Pick on Map'}</span>
              </button>
            </div>
          </div>

          {locationSuccess && (
            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mb-3">
              <CheckCircle2 size={14} />
              <span>{locationSuccess}</span>
            </div>
          )}

          {/* Interactive Map Picker */}
          {showMapPicker && (
            <div className="mb-4">
              <ComplaintMap
                height="280px"
                pickerMode={true}
                selectedLocation={
                  formData.latitude && formData.longitude
                    ? {
                        latitude: parseFloat(formData.latitude),
                        longitude: parseFloat(formData.longitude),
                      }
                    : null
                }
                onLocationSelect={({ latitude, longitude }) => {
                  setFormData((prev) => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                    address: prev.address.trim() ? prev.address : `Location near (${latitude}, ${longitude})`,
                  }))
                  setFieldErrors((prev) => ({
                    ...prev,
                    address: '',
                    latitude: '',
                    longitude: '',
                  }))
                  setLocationSuccess(`Pinned at ${latitude}, ${longitude}`)
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block" htmlFor="latitude">
                Latitude
              </label>
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                className={`form-input text-sm ${fieldErrors.latitude ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                placeholder="e.g. 17.385044"
                value={formData.latitude}
                onChange={handleChange}
              />
              {fieldErrors.latitude && (
                <span className="text-[11px] text-red-600 mt-1 block">{fieldErrors.latitude}</span>
              )}
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block" htmlFor="longitude">
                Longitude
              </label>
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                className={`form-input text-sm ${fieldErrors.longitude ? 'border-red-500 ring-1 ring-red-200' : ''}`}
                placeholder="e.g. 78.486671"
                value={formData.longitude}
                onChange={handleChange}
              />
              {fieldErrors.longitude && (
                <span className="text-[11px] text-red-600 mt-1 block">{fieldErrors.longitude}</span>
              )}
            </div>
          </div>
        </div>

        {/* Photograph Upload Area */}
        <div className="form-group mb-5">
          <label className="form-label font-semibold">
            Attach Photograph <span className="text-xs text-slate-400 font-normal">(Max 5 MB, JPEG/PNG/WebP)</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />

          {!imagePreview ? (
            <div
              className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon-wrapper">
                <Upload size={28} className="text-blue-500" />
              </div>
              <h4 className="upload-dropzone-title">Click to upload or drag and drop photograph</h4>
              <p className="upload-dropzone-sub">Clear photographs help departments resolve issues faster</p>
            </div>
          ) : (
            <div className="image-preview-card">
              <img src={imagePreview} alt="Preview" className="image-preview-thumb" />
              <div className="image-preview-meta">
                <span className="font-semibold text-slate-800 text-sm">
                  {selectedFile ? selectedFile.name : 'Attached photograph'}
                </span>
                <span className="text-xs text-slate-500">
                  {uploadingImage ? 'Uploading photograph...' : formData.imageUrl ? 'Uploaded successfully' : ''}
                </span>
              </div>
              <button
                type="button"
                className="btn-remove-image"
                onClick={handleRemoveImage}
                title="Remove photograph"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Detailed Description */}
        <div className="form-group mb-6">
          <label className="form-label font-semibold" htmlFor="description">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={descriptionInputRef}
            id="description"
            name="description"
            rows="4"
            className={`form-input form-textarea ${fieldErrors.description ? 'border-red-500 focus:border-red-500 ring-1 ring-red-200' : ''}`}
            placeholder="Describe the nature of the problem, duration, and safety hazards..."
            value={formData.description}
            onChange={handleChange}
          />
          {fieldErrors.description && (
            <span className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={13} />
              <span>{fieldErrors.description}</span>
            </span>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/citizen/dashboard" className="btn btn-outline-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || uploadingImage}
          >
            {submitting ? (
              <span>Submitting Complaint...</span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>Submit Complaint</span>
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateReport
