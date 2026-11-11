import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import StatusBadge from './StatusBadge'
import ReportImage from './ReportImage'
import {
  MapPin,
  Filter,
  Layers,
  ExternalLink,
  Search,
  AlertCircle,
  Eye,
} from 'lucide-react'

// Custom Status Pin Icon Generator
const createPinIcon = (status, isSelected = false) => {
  const colorMap = {
    PENDING: '#f59e0b',     // Amber
    ASSIGNED: '#3b82f6',    // Blue
    IN_PROGRESS: '#8b5cf6', // Purple
    RESOLVED: '#10b981',    // Emerald
    REJECTED: '#ef4444',    // Red
  }
  const color = colorMap[status] || '#0284c7'
  const size = isSelected ? 36 : 28

  return L.divIcon({
    className: 'civic-marker-pin',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));
        transition: transform 0.2s ease;
      ">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" stroke="#ffffff" stroke-width="1.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="3" fill="#ffffff" stroke="none"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// Picker Pin Icon for Interactive GPS Location Selection
const pickerPinIcon = L.divIcon({
  className: 'civic-picker-pin',
  html: `
    <div style="
      width: 34px;
      height: 34px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
    ">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="#dc2626" stroke="#ffffff" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="3" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
})

// Auto-adjust map bounds when markers change
function MapBoundsController({ markers, defaultCenter }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map((m) => [m.latitude, m.longitude])
      )
      if (bounds.isValid()) {
        if (markers.length === 1) {
          map.setView([markers[0].latitude, markers[0].longitude], 14)
        } else {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }
      }
    } else if (defaultCenter) {
      map.setView(defaultCenter, 12)
    }
  }, [map, markers, defaultCenter])

  return null
}

// Click event listener for manual location selection
function MapClickPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: parseFloat(e.latlng.lat.toFixed(6)),
          longitude: parseFloat(e.latlng.lng.toFixed(6)),
        })
      }
    },
  })
  return null
}

// Auto-center map when a location is selected in picker mode (e.g. from GPS or manual input)
function SelectedLocationCenterController({ selectedLocation }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !selectedLocation?.latitude || !selectedLocation?.longitude) return
    const lat = Number(selectedLocation.latitude)
    const lng = Number(selectedLocation.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 15, { animate: true })
    }
  }, [map, selectedLocation?.latitude, selectedLocation?.longitude])

  return null
}

export function ComplaintMap({
  reports = [],
  height = '560px',
  viewRole = 'citizen', // 'citizen', 'admin', 'staff'
  pickerMode = false,
  selectedLocation = null, // { latitude, longitude }
  onLocationSelect = null,
  showFilters = true,
  defaultCenter = [17.385044, 78.486671], // Default urban center
}) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReportId, setSelectedReportId] = useState(null)

  // Filter out reports with valid numeric GPS coordinates
  const validReports = useMemo(() => {
    return reports.filter(
      (r) =>
        r.latitude !== null &&
        r.longitude !== null &&
        !isNaN(Number(r.latitude)) &&
        !isNaN(Number(r.longitude)) &&
        Number(r.latitude) >= -90 &&
        Number(r.latitude) <= 90 &&
        Number(r.longitude) >= -180 &&
        Number(r.longitude) <= 180
    )
  }, [reports])

  const missingCoordsCount = reports.length - validReports.length

  // Filter plotted reports by status, category and search query
  const filteredReports = useMemo(() => {
    return validReports.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      const matchCategory =
        categoryFilter === 'ALL' || r.category === categoryFilter
      const matchSearch =
        !searchQuery.trim() ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toString() === searchQuery.trim()

      return matchStatus && matchCategory && matchSearch
    })
  }, [validReports, statusFilter, categoryFilter, searchQuery])

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set(reports.map((r) => r.category).filter(Boolean))
    return Array.from(set)
  }, [reports])

  // Compute map center
  const mapCenter = useMemo(() => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      return [selectedLocation.latitude, selectedLocation.longitude]
    }
    if (filteredReports.length > 0) {
      return [filteredReports[0].latitude, filteredReports[0].longitude]
    }
    return defaultCenter
  }, [selectedLocation, filteredReports, defaultCenter])

  // Get details link based on role
  const getDetailPath = (id) => {
    if (viewRole === 'admin') return `/admin/reports`
    if (viewRole === 'staff') return `/staff/reports/${id}`
    return `/citizen/reports/${id}`
  }

  return (
    <div className="civic-map-wrapper">
      {showFilters && !pickerMode && (
        <div className="civic-map-header mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                className="form-input pl-9 py-1.5 text-xs"
                placeholder="Search pins by ID, title, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-500" />
              <select
                className="form-input form-select py-1.5 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses ({validReports.length})</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-slate-500" />
                <select
                  className="form-input form-select py-1.5 text-xs"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <MapPin size={14} className="text-blue-600" />
              <span>
                Plotted <strong>{filteredReports.length}</strong> geocoded complaint{filteredReports.length !== 1 ? 's' : ''} on map
              </span>
            </span>

            {missingCoordsCount > 0 && (
              <span className="flex items-center gap-1 text-slate-400">
                <AlertCircle size={13} className="text-amber-500" />
                <span>{missingCoordsCount} complaint{missingCoordsCount !== 1 ? 's lack' : ' lacks'} GPS coordinates</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Picker Mode Instruction Banner */}
      {pickerMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-2.5 mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin size={15} className="text-blue-600 shrink-0" />
            <span>Click anywhere on the map to pin the complaint location</span>
          </span>
          {selectedLocation?.latitude && selectedLocation?.longitude && (
            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-900 font-semibold">
              {selectedLocation.latitude}, {selectedLocation.longitude}
            </span>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        className="civic-map-box rounded-xl overflow-hidden border border-slate-200 shadow-sm relative"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Bounds Adjuster */}
          {!pickerMode && (
            <MapBoundsController
              markers={filteredReports}
              defaultCenter={defaultCenter}
            />
          )}

          {/* Interactive Click Picker */}
          {pickerMode && onLocationSelect && (
            <MapClickPicker onLocationSelect={onLocationSelect} />
          )}

          {/* Auto-recenter on selected or detected GPS spot in picker mode */}
          {pickerMode && selectedLocation?.latitude && selectedLocation?.longitude && (
            <SelectedLocationCenterController selectedLocation={selectedLocation} />
          )}

          {/* Selected Location Pin in Picker Mode */}
          {pickerMode && selectedLocation?.latitude && selectedLocation?.longitude && (
            <Marker
              position={[selectedLocation.latitude, selectedLocation.longitude]}
              icon={pickerPinIcon}
            >
              <Popup>
                <div className="text-xs p-1">
                  <strong className="block text-slate-900">Selected Incident Spot</strong>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Lat: {selectedLocation.latitude}<br />
                    Lng: {selectedLocation.longitude}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Plotted Complaint Markers */}
          {!pickerMode &&
            filteredReports.map((report) => (
              <Marker
                key={report.id}
                position={[Number(report.latitude), Number(report.longitude)]}
                icon={createPinIcon(report.status, report.id === selectedReportId)}
                eventHandlers={{
                  click: () => setSelectedReportId(report.id),
                }}
              >
                <Popup className="civic-map-popup">
                  <div className="p-1 max-w-xs">
                    {/* Header with ID and Status */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        #CIV-{report.id}
                      </span>
                      <StatusBadge status={report.status} />
                    </div>

                    {/* Photograph thumbnail */}
                    {report.imageUrl && (
                      <div className="rounded overflow-hidden mb-2 border border-slate-200">
                        <ReportImage
                          imageUrl={report.imageUrl}
                          altText={report.title}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                      {report.title}
                    </h4>

                    {/* Meta info */}
                    <div className="space-y-1 text-xs text-slate-600 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">Category:</span>
                        <span>{report.category}</span>
                      </div>
                      {report.priority && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">Priority:</span>
                          <StatusBadge status={report.priority} type="priority" />
                        </div>
                      )}
                      <div className="flex items-start gap-1 text-[11px] text-slate-500">
                        <MapPin size={12} className="shrink-0 mt-0.5 text-blue-500" />
                        <span className="line-clamp-2">{report.address || 'Address not recorded'}</span>
                      </div>
                    </div>

                    {/* Action link */}
                    <Link
                      to={getDetailPath(report.id)}
                      className="btn btn-sm btn-primary w-full text-center flex items-center justify-center gap-1 py-1"
                    >
                      <Eye size={12} />
                      <span>View Full Details</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Status Legend Overlay */}
        {!pickerMode && (
          <div className="civic-map-legend">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Status Legend
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Assigned</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                <span>In Progress</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Resolved</span>
              </span>
              <span className="flex items-center gap-1.5 col-span-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Rejected</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplaintMap
