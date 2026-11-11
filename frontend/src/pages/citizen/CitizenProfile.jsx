import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import reportService from '../../services/reportService'
import authService from '../../services/authService'
import StatusBadge from '../../components/StatusBadge'
import Loading from '../../components/Loading'
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  PhoneCall,
} from 'lucide-react'

export function CitizenProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(user)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadProfileData = async () => {
      try {
        const [userData, reportsData] = await Promise.all([
          authService.getCurrentUser(),
          reportService.getMyReports(),
        ])
        if (isMounted) {
          setProfile(userData)
          setReports(reportsData || [])
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadProfileData()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return <Loading fullScreen message="Loading profile..." />
  }

  const total = reports.length
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length
  const pending = reports.filter((r) => r.status === 'PENDING').length

  return (
    <div className="portal-page max-w-3xl mx-auto">
      <div className="page-header mb-6">
        <span className="page-header-eyebrow">User Profile</span>
        <h1 className="page-title">Citizen Account Details</h1>
        <p className="page-subtitle">
          Manage your personal civic profile and review your participation metrics.
        </p>
      </div>

      {/* Profile Card */}
      <div className="content-card mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl font-bold shadow-md">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{profile?.name}</h2>
            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <Mail size={14} />
              <span>{profile?.email}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <StatusBadge status={profile?.role} type="role" />
              <span className="badge badge-status-resolved">Active Account</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">Phone Number</span>
            <div className="flex items-center gap-2 text-slate-800 font-medium text-sm">
              <Phone size={15} className="text-blue-500" />
              <span>{profile?.phone || 'Not specified'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-400 font-medium block mb-1">Account Created</span>
            <div className="flex items-center gap-2 text-slate-800 font-medium text-sm">
              <Calendar size={15} className="text-blue-500" />
              <span>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString([], {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Citizen Grievance Activity Stats */}
      <div className="content-card mb-6">
        <h3 className="content-card-title mb-4">Grievance Activity Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <FileText size={20} className="text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-900">{total}</div>
            <div className="text-xs text-blue-700">Total Filed</div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <Clock size={20} className="text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-900">{pending}</div>
            <div className="text-xs text-amber-700">Pending Review</div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg">
            <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-emerald-900">{resolved}</div>
            <div className="text-xs text-emerald-700">Resolved</div>
          </div>
        </div>
      </div>

      {/* Civic Assistance Box */}
      <div className="content-card bg-slate-900 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <PhoneCall size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Need Urgent Civic Assistance?</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              For immediate emergencies such as electric hazards, open deep manholes, or major road cave-ins, call the 24/7 Central Municipal Control Room directly.
            </p>
            <div className="text-xs text-cyan-400 font-mono font-semibold">
              Toll-Free Control Room: 1800-111-001 / 040-23456789
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CitizenProfile
