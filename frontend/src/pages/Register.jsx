import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export function Register() {
  const { register, login, isAuthenticated, getRoleDashboardPath } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRoleDashboardPath(), { replace: true })
    }
  }, [isAuthenticated, navigate, getRoleDashboardPath])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.')
      return
    }

    setLoading(true)

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      })

      setSuccess(true)

      // Automatically sign in the citizen
      try {
        await login(formData.email.trim(), formData.password)
        setTimeout(() => {
          navigate('/citizen/dashboard', { replace: true })
        }, 1000)
      } catch (loginErr) {
        console.error('Auto login after registration failed:', loginErr)
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1500)
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err.response) {
        if (err.response.status === 409) {
          setError('An account with this email address already exists. Please sign in or use another email.')
        } else if (err.response.data?.message) {
          setError(err.response.data.message)
        } else {
          setError('Registration failed. Please check your information and try again.')
        }
      } else {
        setError('Unable to connect to the CivicLens server. Please check your network connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-icon">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="auth-title">Citizen Registration</h2>
          <p className="auth-subtitle">
            Create your public account to report civic issues, track progress, and receive updates.
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={16} />
            <span>Registration successful! Signing you in...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Jane Citizen"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              Mobile Phone <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="input-with-icon">
              <Phone size={18} className="input-icon" />
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading || success}
          >
            {loading ? (
              <span>Creating Citizen Account...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Create Citizen Account</span>
                <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-sm text-slate-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="auth-link font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
