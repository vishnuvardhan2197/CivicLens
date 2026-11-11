import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

export function Login() {
  const { login, isAuthenticated, getRoleDashboardPath } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if session expired
  const sessionExpired = location.search.includes('session=expired')

  // If already authenticated, redirect to portal dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRoleDashboardPath(), { replace: true })
    }
  }, [isAuthenticated, navigate, getRoleDashboardPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loggedInUser = await login(email.trim(), password)
      const redirectPath =
        location.state?.from?.pathname || getRoleDashboardPath(loggedInUser.role)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      if (err.response) {
        if (err.response.status === 401) {
          setError('Invalid email or password. Please verify your credentials.')
        } else if (err.response.data?.message) {
          setError(err.response.data.message)
        } else {
          setError('Authentication failed. Please try again.')
        }
      } else {
        setError('Unable to connect to CivicLens backend server. Please verify backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper demo fill
  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="auth-title">Sign In to CivicLens</h2>
          <p className="auth-subtitle">
            Access your civic complaint portal, field tasks, or administrative dashboard.
          </p>
        </div>

        {sessionExpired && (
          <div className="auth-alert auth-alert-warning">
            <AlertCircle size={16} />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label" htmlFor="password">
                Password
              </label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Sign In</span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast-Login Pills */}
        <div className="auth-demo-box">
          <span className="auth-demo-title">Quick Demo Logins:</span>
          <div className="auth-demo-pills">
            <button
              type="button"
              className="demo-pill demo-pill-citizen"
              onClick={() => setDemoCredentials('jane.citizen@example.com', 'Password@123')}
            >
              Citizen Demo
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-staff"
              onClick={() => setDemoCredentials('ramesh.staff@civiclens.gov', 'StaffPass@123')}
            >
              Staff Demo
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-admin"
              onClick={() => setDemoCredentials('admin@civiclens.gov', 'Admin@12345')}
            >
              Admin Demo
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p className="text-sm text-slate-500 text-center">
            New to CivicLens?{' '}
            <Link to="/register" className="auth-link font-semibold">
              Register as a Citizen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
