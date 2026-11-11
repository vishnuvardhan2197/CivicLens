import { useState } from 'react'
import { API_BASE_URL } from '../services/api'
import { Image, ExternalLink, ZoomIn } from 'lucide-react'

export function ReportImage({ imageUrl, altText = 'Complaint photograph', className = '', showZoom = true }) {
  const [imageError, setImageError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  if (!imageUrl || imageError) {
    return (
      <div className={`report-no-image ${className}`}>
        <Image size={24} className="text-slate-400" />
        <span>No photograph attached</span>
      </div>
    )
  }

  const fullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
    ? imageUrl
    : `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`

  return (
    <>
      <div className={`report-image-container ${className}`}>
        <img
          src={fullUrl}
          alt={altText}
          className="report-image-thumb"
          loading="lazy"
          onError={() => setImageError(true)}
          onClick={() => showZoom && setIsZoomed(true)}
        />
        {showZoom && (
          <div className="report-image-overlay" onClick={() => setIsZoomed(true)}>
            <ZoomIn size={16} />
            <span>View</span>
          </div>
        )}
      </div>

      {isZoomed && (
        <div className="modal-backdrop" onClick={() => setIsZoomed(false)}>
          <div className="modal-image-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-image-header">
              <span className="font-semibold">{altText}</span>
              <div className="flex items-center gap-2">
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-icon"
                  title="Open full size in new tab"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsZoomed(false)}
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="modal-image-body">
              <img src={fullUrl} alt={altText} className="modal-full-img" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportImage
