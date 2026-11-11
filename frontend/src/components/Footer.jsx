import { Shield, PhoneCall, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="portal-footer">
      <div className="portal-footer-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="navbar-logo-icon">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CivicLens</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Modern Municipal Complaint & Infrastructure Redressal System. Connecting citizens with civic authorities for accountable public governance.
            </p>
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Civic Systems Operational</span>
            </div>
          </div>

          {/* Quick Support */}
          <div className="footer-col">
            <h4 className="footer-heading">Emergency Helplines</h4>
            <ul className="footer-list">
              <li>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <PhoneCall size={14} className="text-cyan-400" />
                  <span>Civic Helpline: 1800-111-001</span>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <PhoneCall size={14} className="text-cyan-400" />
                  <span>Disaster & Drainage: 1800-111-005</span>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Mail size={14} className="text-cyan-400" />
                  <span>support@civiclens.gov</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Civic Departments */}
          <div className="footer-col">
            <h4 className="footer-heading">Municipal Departments</h4>
            <ul className="footer-list text-sm text-slate-400">
              <li>Roads & Infrastructure</li>
              <li>Sanitation & Waste Management</li>
              <li>Water Supply & Drainage</li>
              <li>Streetlights & Electricity</li>
              <li>Public Health & Safety</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} CivicLens Municipal Governance Platform. Built for citizens, administrators, and field staff.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Open Civic Data</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
