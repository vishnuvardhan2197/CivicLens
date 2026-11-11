import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import departmentService from '../services/departmentService'
import {
  Camera,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react'

export function Home() {
  const { isAuthenticated, getRoleDashboardPath, user } = useAuth()
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    departmentService
      .getAllDepartments(true)
      .then((data) => setDepartments(data.slice(0, 6)))
      .catch((err) => console.error('Failed to load departments:', err))
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Modern Municipal Governance & Complaint Redressal</span>
            </div>
            <h1 className="hero-title">
              Empowering Citizens. <br />
              <span className="hero-title-gradient">Transforming Cities.</span>
            </h1>
            <p className="hero-subtitle">
              CivicLens bridges the gap between citizens and municipal authorities.
              Capture civic issues with GPS coordinates and live photographs, track resolution milestones in real time, and hold municipal departments accountable.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to={getRoleDashboardPath()} className="btn btn-hero-primary">
                  <span>Open {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'MUNICIPAL_STAFF' ? 'Staff' : 'Citizen'} Portal</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/citizen/create-report" className="btn btn-hero-primary">
                    <Camera size={18} />
                    <span>Report a Civic Issue</span>
                  </Link>
                  <Link to="/login" className="btn btn-hero-secondary">
                    <span>Sign In to Portal</span>
                    <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Impact Metrics Bar */}
      <section className="stats-bar-section">
        <div className="stats-bar-container">
          <div className="stat-card">
            <div className="stat-icon-wrapper bg-blue-500/10 text-blue-500">
              <Activity size={24} />
            </div>
            <div>
              <div className="stat-value">100%</div>
              <div className="stat-label">Transparent Tracking</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="stat-value">Proof-of-Work</div>
              <div className="stat-label">Verified Resolution</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-cyan-500/10 text-cyan-500">
              <Building2 size={24} />
            </div>
            <div>
              <div className="stat-value">6+</div>
              <div className="stat-label">Municipal Departments</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-indigo-500/10 text-indigo-500">
              <Users size={24} />
            </div>
            <div>
              <div className="stat-value">Role-Based</div>
              <div className="stat-label">Citizen, Staff & Admin</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">How CivicLens Works</span>
            <h2 className="section-title">Transparent Redressal in Four Steps</h2>
            <p className="section-subtitle">
              From complaint submission to field execution and photo verification, every step is logged on an immutable audit trail.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <div className="workflow-step-num">01</div>
              <div className="workflow-icon bg-cyan-50 text-cyan-600">
                <Camera size={24} />
              </div>
              <h3 className="workflow-card-title">Snap & Geotag</h3>
              <p className="workflow-card-desc">
                Citizen captures the issue with photo upload, automatic GPS coordinates, and landmark details in seconds.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">02</div>
              <div className="workflow-icon bg-blue-50 text-blue-600">
                <Building2 size={24} />
              </div>
              <h3 className="workflow-card-title">Department Routing</h3>
              <p className="workflow-card-desc">
                Administrators triage incoming complaints and assign them to the concerned municipal department and field officer.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">03</div>
              <div className="workflow-icon bg-amber-50 text-amber-600">
                <Clock size={24} />
              </div>
              <h3 className="workflow-card-title">Field Action</h3>
              <p className="workflow-card-desc">
                Municipal staff view assigned work queues, inspect site locations, and transition status to in-progress with remarks.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">04</div>
              <div className="workflow-icon bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="workflow-card-title">Proof Verification</h3>
              <p className="workflow-card-desc">
                Staff uploads resolution proof photographs. Citizen is automatically notified of successful complaint closure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Municipal Departments Grid */}
      <section className="departments-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Municipal Coverage</span>
            <h2 className="section-title">Civic Services & Departments</h2>
            <p className="section-subtitle">
              CivicLens coordinates across specialized urban local bodies to resolve issues promptly.
            </p>
          </div>

          <div className="departments-grid">
            {departments.length > 0 ? (
              departments.map((dept) => (
                <div key={dept.id} className="department-card">
                  <div className="department-card-header">
                    <div className="dept-icon-box">
                      <Building2 size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="dept-name">{dept.name}</h4>
                      <span className="dept-contact">{dept.contactPhone || '1800-CIVIC'}</span>
                    </div>
                  </div>
                  <p className="dept-desc">{dept.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-400 py-6">
                Loading municipal departments...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Role CTA Section */}
      <section className="portals-cta-section">
        <div className="section-container">
          <div className="portals-grid">
            <div className="portal-cta-card">
              <div className="portal-badge-pill bg-blue-100 text-blue-700">Citizens</div>
              <h3>Public Citizen Portal</h3>
              <p>File grievances, monitor resolution progress, receive SMS/email-style notifications, and view historical complaints.</p>
              <Link to="/register" className="btn btn-outline-primary mt-4">
                Register as Citizen
              </Link>
            </div>

            <div className="portal-cta-card">
              <div className="portal-badge-pill bg-purple-100 text-purple-700">Staff & Admin</div>
              <h3>Authority & Staff Access</h3>
              <p>Municipal officers and city administrators can log in to triage issues, manage staff queues, and review city analytics.</p>
              <Link to="/login" className="btn btn-primary mt-4">
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
