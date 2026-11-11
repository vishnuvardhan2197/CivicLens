import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import analyticsService from '../../services/analyticsService'
import reportService from '../../services/reportService'
import StatusBadge from '../../components/StatusBadge'
import ReportImage from '../../components/ReportImage'
import Loading from '../../components/Loading'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  ArrowRight,
  Percent,
  Timer,
  Layers,
  XCircle,
  MapPin,
  UserCheck,
} from 'lucide-react'

export function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [pendingReports, setPendingReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, reportsData] = await Promise.all([
        analyticsService.getSummary(),
        reportService.getAllReports({ status: 'PENDING', size: 6 }),
      ])
      setSummary(summaryData)
      const list = reportsData?.content ? reportsData.content : Array.isArray(reportsData) ? reportsData : []
      setPendingReports(list.slice(0, 5))
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
      setError('Failed to load executive metrics. Please check admin authorization.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  if (loading) {
    return <Loading fullScreen message="Loading administrative intelligence..." />
  }

  return (
    <div className="portal-page">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <span className="page-header-eyebrow">Administrative Command Center</span>
          <h1 className="page-title">Executive Civic Dashboard</h1>
          <p className="page-subtitle">
            City-wide infrastructure complaints, department allocation, and resolution performance.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link to="/admin/map" className="btn btn-outline-primary">
            <MapPin size={16} />
            <span>Citywide Map</span>
          </Link>
          <Link to="/admin/reports" className="btn btn-primary">
            <FileText size={16} />
            <span>Manage Complaints</span>
          </Link>
          <Link to="/admin/users" className="btn btn-outline-secondary">
            <Users size={16} />
            <span>Staff Directory</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI 8 Overview Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <div className="metric-card border-blue-200">
          <div className="metric-header">
            <span className="metric-title">Total Complaints</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="metric-value">{summary?.totalComplaints ?? 0}</div>
          <span className="metric-caption">Citywide registered complaints</span>
        </div>

        <div className="metric-card border-amber-200">
          <div className="metric-header">
            <span className="metric-title">Pending</span>
            <div className="metric-icon-box bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="metric-value text-amber-600">
            {summary?.pendingComplaints ?? 0}
          </div>
          <span className="metric-caption">Awaiting department triage</span>
        </div>

        <div className="metric-card border-blue-200">
          <div className="metric-header">
            <span className="metric-title">Assigned</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <Layers size={20} />
            </div>
          </div>
          <div className="metric-value text-blue-600">
            {summary?.assignedComplaints ?? 0}
          </div>
          <span className="metric-caption">Allocated to field officers</span>
        </div>

        <div className="metric-card border-purple-200">
          <div className="metric-header">
            <span className="metric-title">In Progress</span>
            <div className="metric-icon-box bg-purple-50 text-purple-600">
              <Layers size={20} />
            </div>
          </div>
          <div className="metric-value text-purple-600">
            {summary?.inProgressComplaints ?? 0}
          </div>
          <span className="metric-caption">Under active field work</span>
        </div>

        <div className="metric-card border-emerald-200">
          <div className="metric-header">
            <span className="metric-title">Resolved</span>
            <div className="metric-icon-box bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald-600">
            {summary?.resolvedComplaints ?? 0}
          </div>
          <span className="metric-caption">Verified closed complaints</span>
        </div>

        <div className="metric-card border-rose-200">
          <div className="metric-header">
            <span className="metric-title">Rejected</span>
            <div className="metric-icon-box bg-rose-50 text-rose-600">
              <XCircle size={20} />
            </div>
          </div>
          <div className="metric-value text-rose-600">
            {summary?.rejectedComplaints ?? 0}
          </div>
          <span className="metric-caption">Invalid or duplicate reports</span>
        </div>

        <div className="metric-card border-slate-200">
          <div className="metric-header">
            <span className="metric-title">Total Citizens</span>
            <div className="metric-icon-box bg-slate-50 text-slate-600">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value text-slate-800">
            {summary?.totalCitizens ?? 0}
          </div>
          <span className="metric-caption">Registered community users</span>
        </div>

        <div className="metric-card border-cyan-200">
          <div className="metric-header">
            <span className="metric-title">Total Staff</span>
            <div className="metric-icon-box bg-cyan-50 text-cyan-600">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="metric-value text-cyan-600">
            {summary?.totalMunicipalStaff ?? 0}
          </div>
          <span className="metric-caption">Authorized municipal officers</span>
        </div>
      </div>

      {/* Secondary Efficiency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-purple-50 text-purple-600">
            <Percent size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Resolution Rate</span>
            <div className="text-xl font-bold text-slate-800">
              {summary?.resolutionRatePercent ?? 0}%
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-indigo-50 text-indigo-600">
            <Timer size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Avg Turnaround Time</span>
            <div className="text-xl font-bold text-slate-800">
              {summary?.averageResolutionHours ?? 0} hrs
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-teal-50 text-teal-600">
            <Users size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Municipal Staff</span>
            <div className="text-xl font-bold text-slate-800">
              {summary?.totalMunicipalStaff ?? 0} officers
            </div>
          </div>
        </div>

        <div className="stat-subcard">
          <div className="stat-subcard-icon bg-rose-50 text-rose-600">
            <Building2 size={18} />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Municipal Departments</span>
            <div className="text-xl font-bold text-slate-800">
              {summary?.totalDepartments ?? 0} depts
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link to="/admin/reports" className="admin-nav-card">
          <div className="admin-nav-icon bg-blue-100 text-blue-700">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Complaint Triage & Assignment</h4>
            <p className="text-xs text-slate-500 mt-1">Assign complaints to departments and field staff</p>
          </div>
          <ArrowRight size={18} className="text-slate-400 ml-auto" />
        </Link>

        <Link to="/admin/departments" className="admin-nav-card">
          <div className="admin-nav-icon bg-cyan-100 text-cyan-700">
            <Building2 size={22} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Department Management</h4>
            <p className="text-xs text-slate-500 mt-1">Configure civic bodies, helplines, and assignments</p>
          </div>
          <ArrowRight size={18} className="text-slate-400 ml-auto" />
        </Link>

        <Link to="/admin/analytics" className="admin-nav-card">
          <div className="admin-nav-icon bg-emerald-100 text-emerald-700">
            <FileText size={22} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Analytics & Civic Insights</h4>
            <p className="text-xs text-slate-500 mt-1">Deep breakdown of category workloads and trends</p>
          </div>
          <ArrowRight size={18} className="text-slate-400 ml-auto" />
        </Link>
      </div>

      {/* Pending Triage Queue */}
      <div className="content-card">
        <div className="content-card-header flex items-center justify-between">
          <div>
            <h2 className="content-card-title flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <span>Complaints Requiring Immediate Triage</span>
            </h2>
            <p className="content-card-subtitle">Pending citizen reports requiring department and staff routing</p>
          </div>
          <Link to="/admin/reports?status=PENDING" className="btn-link flex items-center gap-1 text-sm font-semibold text-blue-600">
            <span>View All Pending ({summary?.pendingComplaints ?? 0})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {pendingReports.length === 0 ? (
          <div className="empty-state py-8">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
            <h3 className="empty-state-title">No pending complaints!</h3>
            <p className="empty-state-desc">All incoming citizen reports have been routed to concerned departments.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Photograph</th>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Date Filed</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingReports.map((report) => (
                  <tr key={report.id}>
                    <td className="font-mono text-xs text-slate-500">#{report.id}</td>
                    <td className="w-16">
                      <ReportImage
                        imageUrl={report.imageUrl}
                        altText={report.title}
                        className="table-thumb"
                      />
                    </td>
                    <td>
                      <span className="font-semibold text-slate-900 block line-clamp-1">{report.title}</span>
                      <span className="text-xs text-slate-500 block line-clamp-1">{report.address}</span>
                    </td>
                    <td>
                      <span className="badge badge-default">{report.category}</span>
                    </td>
                    <td>
                      <StatusBadge status={report.priority} type="priority" />
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link
                        to={`/admin/reports?assignId=${report.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <span>Assign Now</span>
                        <ArrowRight size={13} />
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

export default AdminDashboard
