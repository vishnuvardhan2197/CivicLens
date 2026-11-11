import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import analyticsService from '../../services/analyticsService'
import Loading from '../../components/Loading'
import {
  BarChart3,
  TrendingUp,
  Percent,
  Timer,
  Building2,
  Users,
  Layers,
  AlertCircle,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react'

// Custom tooltip renderer for clean theme consistency
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
        <div className="font-semibold text-slate-200 mb-1">{label || payload[0].name}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-slate-300">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span>{entry.name || 'Count'}:</span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AdminAnalytics() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [monthly, setMonthly] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, catsData, deptsData, monthlyData] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getCategories(),
        analyticsService.getDepartments(),
        analyticsService.getMonthly(),
      ])
      setSummary(summaryData)
      setCategories(Array.isArray(catsData) ? catsData : [])
      setDepartments(Array.isArray(deptsData) ? deptsData : [])
      setMonthly(Array.isArray(monthlyData) ? monthlyData : [])
    } catch (err) {
      console.error('Analytics load error:', err)
      setError('Failed to load civic intelligence. Please verify administrative permissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  // 1. Status Donut Chart Data
  const statusChartData = useMemo(() => {
    if (!summary) return []
    const raw = [
      { name: 'Pending', value: summary.pendingComplaints || 0, color: '#f59e0b' },
      { name: 'Assigned', value: summary.assignedComplaints || 0, color: '#3b82f6' },
      { name: 'In Progress', value: summary.inProgressComplaints || 0, color: '#8b5cf6' },
      { name: 'Resolved', value: summary.resolvedComplaints || 0, color: '#10b981' },
      { name: 'Rejected', value: summary.rejectedComplaints || 0, color: '#ef4444' },
    ]
    return raw.filter((item) => item.value > 0)
  }, [summary])

  // 2. Category Bar Chart Data
  const categoryChartData = useMemo(() => {
    return categories.map((c) => ({
      category: c.category || 'Other',
      count: Number(c.count || 0),
    }))
  }, [categories])

  // 3. Monthly Line Chart Data
  const monthlyChartData = useMemo(() => {
    return monthly.map((m) => ({
      month: m.month || 'N/A',
      submitted: Number(m.submitted ?? m.count ?? 0),
      resolved: Number(m.resolved ?? 0),
    }))
  }, [monthly])

  // 4. Department Workload Bar Chart Data
  const departmentChartData = useMemo(() => {
    return departments.map((d) => ({
      department: d.department || d.departmentName || 'General',
      count: Number(d.count || 0),
    }))
  }, [departments])

  if (loading) {
    return <Loading fullScreen message="Synthesizing municipal intelligence and rendering charts..." />
  }

  const totalComplaints = summary?.totalComplaints || 0

  return (
    <div className="portal-page">
      <div className="page-header mb-6">
        <span className="page-header-eyebrow">Civic Intelligence</span>
        <h1 className="page-title">Executive Analytics & Telemetry</h1>
        <p className="page-subtitle">
          Real-time municipal telemetry, departmental resolution rates, and complaint categorization.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Level Metric KPIs (Section 5 & 6: Resolution Stats & Average Resolution Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="metric-card border-emerald-200">
          <div className="metric-header">
            <span className="metric-title">Resolution Rate</span>
            <div className="metric-icon-box bg-emerald-50 text-emerald-600">
              <Percent size={20} />
            </div>
          </div>
          <div className="metric-value text-emerald-600">
            {summary?.resolutionRatePercent ?? 0}%
          </div>
          <span className="metric-caption">
            {summary?.resolvedComplaints ?? 0} of {totalComplaints} complaints closed
          </span>
        </div>

        <div className="metric-card border-blue-200">
          <div className="metric-header">
            <span className="metric-title">Average Resolution Time</span>
            <div className="metric-icon-box bg-blue-50 text-blue-600">
              <Timer size={20} />
            </div>
          </div>
          <div className="metric-value text-blue-600">
            {summary?.averageResolutionHours ?? 0} <span className="text-sm font-normal">hrs</span>
          </div>
          <span className="metric-caption">Turnaround from submission to proof</span>
        </div>

        <div className="metric-card border-cyan-200">
          <div className="metric-header">
            <span className="metric-title">Authorized Field Staff</span>
            <div className="metric-icon-box bg-cyan-50 text-cyan-600">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value text-cyan-600">
            {summary?.totalMunicipalStaff ?? 0}
          </div>
          <span className="metric-caption">Active field officers across departments</span>
        </div>

        <div className="metric-card border-purple-200">
          <div className="metric-header">
            <span className="metric-title">Citizen Participation</span>
            <div className="metric-icon-box bg-purple-50 text-purple-600">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="metric-value text-purple-600">
            {summary?.totalCitizens ?? 0}
          </div>
          <span className="metric-caption">Registered community accounts</span>
        </div>
      </div>

      {/* Row 1: Charts (Complaints by Status & Complaints by Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 1. Complaints by Status – Donut Chart */}
        <div className="content-card">
          <div className="content-card-header flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div>
              <h3 className="content-card-title flex items-center gap-2">
                <PieIcon size={18} className="text-blue-600" />
                <span>Complaints by Lifecycle Status</span>
              </h3>
              <p className="content-card-subtitle">Current distribution of citywide complaints</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {totalComplaints} Total
            </span>
          </div>

          {statusChartData.length === 0 ? (
            <div className="empty-state py-12">
              <PieIcon size={40} className="text-slate-300 mx-auto mb-2" />
              <p className="empty-state-desc">No complaints recorded to build status breakdown.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-700 font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 2. Complaints by Category – Bar Chart */}
        <div className="content-card">
          <div className="content-card-header flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div>
              <h3 className="content-card-title flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <span>Complaints by Civic Category</span>
              </h3>
              <p className="content-card-subtitle">Volume breakdown across public services</p>
            </div>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="empty-state py-12">
              <Layers size={40} className="text-slate-300 mx-auto mb-2" />
              <p className="empty-state-desc">No category data recorded yet.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryChartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="category"
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Complaints"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Charts (Monthly Trends & Department Workload) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 3. Monthly Complaint Trends – Line Chart */}
        <div className="content-card">
          <div className="content-card-header flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div>
              <h3 className="content-card-title flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                <span>Monthly Complaint & Resolution Trends</span>
              </h3>
              <p className="content-card-subtitle">Inflow versus resolved grievances over time</p>
            </div>
          </div>

          {monthlyChartData.length === 0 ? (
            <div className="empty-state py-12">
              <TrendingUp size={40} className="text-slate-300 mx-auto mb-2" />
              <p className="empty-state-desc">No historical monthly data available yet.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="plainline"
                    formatter={(value) => (
                      <span className="text-xs text-slate-700 font-medium">{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted Issues"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved Issues"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 4. Department-Wise Complaints – Bar Chart */}
        <div className="content-card">
          <div className="content-card-header flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div>
              <h3 className="content-card-title flex items-center gap-2">
                <Building2 size={18} className="text-purple-600" />
                <span>Department Workload Allocation</span>
              </h3>
              <p className="content-card-subtitle">Volume routed across municipal divisions</p>
            </div>
          </div>

          {departmentChartData.length === 0 ? (
            <div className="empty-state py-12">
              <Building2 size={40} className="text-slate-300 mx-auto mb-2" />
              <p className="empty-state-desc">No department allocations recorded yet.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={110}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Assigned Complaints"
                    fill="#8b5cf6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Department Summary Table */}
      <div className="content-card">
        <h3 className="content-card-title mb-1 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-slate-700" />
          <span>Department Performance & Workload Breakdown</span>
        </h3>
        <p className="content-card-subtitle mb-4">Complete table of municipal divisions and complaint shares</p>

        {departments.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No department records available.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Complaints Assigned</th>
                  <th>Share of Citywide Volume</th>
                  <th className="text-right">Workload Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => {
                  const share = totalComplaints > 0 ? Math.round(((dept.count || 0) / totalComplaints) * 100) : 0
                  return (
                    <tr key={dept.department || dept.departmentName || idx}>
                      <td className="font-semibold text-slate-800">
                        {dept.department || dept.departmentName || 'General Civic'}
                      </td>
                      <td className="font-bold text-slate-900">{dept.count || 0}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, share)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{share}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span className={`badge ${dept.count > 5 ? 'badge-status-in-progress' : 'badge-default'}`}>
                          {dept.count > 5 ? 'High Volume' : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
