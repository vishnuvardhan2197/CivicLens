import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://localhost:8080'

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginMessage, setLoginMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)

  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    imageUrl: ''
  })

  const [reportMessage, setReportMessage] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('civiclens_token')

    if (token) {
      setShowDashboard(true)
      fetchMyReports()
    }
  }, [])

  const getToken = () => {
    return localStorage.getItem('civiclens_token')
  }

  const fetchMyReports = async () => {
    const token = getToken()

    if (!token) {
      return
    }

    setLoadingReports(true)

    try {
      const response = await fetch(`${API}/reports/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Unable to load reports')
      }

      const data = await response.json()
      setReports(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    setIsLoggingIn(true)
    setLoginMessage('')

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const contentType = response.headers.get('content-type') || ''

      const data = contentType.includes('application/json')
          ? await response.json()
          : await response.text()

      if (!response.ok) {
        throw new Error(
            typeof data === 'string'
                ? data
                : data.message || 'Invalid email or password'
        )
      }

      const token = typeof data === 'object' ? data.token : null

      if (!token) {
        throw new Error('Login succeeded but no token was returned')
      }

      localStorage.setItem('civiclens_token', token)
      localStorage.setItem('civiclens_user_email', email)

      setLoginMessage('Login successful!')

      setEmail('')
      setPassword('')

      setTimeout(() => {
        setShowLogin(false)
        setShowDashboard(true)
        fetchMyReports()
      }, 500)

    } catch (error) {
      setLoginMessage(error.message || 'Login failed')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('civiclens_token')
    localStorage.removeItem('civiclens_user_email')

    setReports([])
    setShowDashboard(false)
    setShowReport(false)
  }

  const openReportForm = () => {
    setReportMessage('')
    setLocationMessage('')
    setShowReport(true)
  }

  const closeReportForm = () => {
    if (isSubmittingReport) {
      return
    }

    setShowReport(false)
    setReportMessage('')
  }

  const handleReportChange = (e) => {
    const { name, value } = e.target

    setReportForm((previous) => ({
      ...previous,
      [name]: value
    }))
  }

  const detectLocation = () => {
    setLocationMessage('Detecting your location...')

    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude

          setReportForm((previous) => ({
            ...previous,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }))

          setLocationMessage(
              `Location detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          )
        },
        () => {
          setLocationMessage(
              'Unable to detect location. Please allow location access.'
          )
        }
    )
  }

  const submitReport = async (e) => {
    e.preventDefault()

    setIsSubmittingReport(true)
    setReportMessage('')

    const token = getToken()

    if (!token) {
      setReportMessage('Please login again.')
      setIsSubmittingReport(false)
      return
    }

    try {
      const response = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: reportForm.title,
          description: reportForm.description,
          category: reportForm.category,
          latitude: reportForm.latitude
              ? Number(reportForm.latitude)
              : null,
          longitude: reportForm.longitude
              ? Number(reportForm.longitude)
              : null,
          imageUrl: reportForm.imageUrl || null
        })
      })

      const contentType = response.headers.get('content-type') || ''

      const data = contentType.includes('application/json')
          ? await response.json()
          : await response.text()

      if (!response.ok) {
        throw new Error(
            typeof data === 'string'
                ? data
                : data.message || 'Unable to submit report'
        )
      }

      setReportMessage('Report submitted successfully!')

      setReportForm({
        title: '',
        description: '',
        category: '',
        latitude: '',
        longitude: '',
        imageUrl: ''
      })

      await fetchMyReports()

      setTimeout(() => {
        setShowReport(false)
        setReportMessage('')
      }, 900)

    } catch (error) {
      setReportMessage(error.message || 'Failed to submit report')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  const deleteReport = async (id) => {
    const token = getToken()

    if (!token) {
      return
    }

    const confirmed = window.confirm(
        'Are you sure you want to delete this report?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`${API}/reports/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Unable to delete report')
      }

      fetchMyReports()
    } catch (error) {
      alert(error.message)
    }
  }

  const pendingReports = reports.filter(
      (report) =>
          report.status === 'PENDING' ||
          report.status === 'pending'
  )

  const inProgressReports = reports.filter(
      (report) =>
          report.status === 'IN_PROGRESS' ||
          report.status === 'IN PROGRESS' ||
          report.status === 'in_progress'
  )

  const resolvedReports = reports.filter(
      (report) =>
          report.status === 'RESOLVED' ||
          report.status === 'resolved'
  )

  if (showDashboard) {
    return (
        <div className="dashboard-app">

          <nav className="dashboard-nav">
            <div className="brand">
              <div className="brand-mark">C</div>
              <span>CivicLens</span>
            </div>

            <div className="dashboard-nav-right">
            <span className="user-email">
              {localStorage.getItem('civiclens_user_email')}
            </span>

              <button
                  className="logout-btn"
                  onClick={logout}
              >
                Logout
              </button>
            </div>
          </nav>

          <main className="dashboard">

            <section className="dashboard-hero">

              <div>
                <div className="eyebrow">
                  CITIZEN DASHBOARD
                </div>

                <h1>
                  Welcome to CivicLens.
                </h1>

                <p>
                  Report civic problems and track their progress from one place.
                </p>
              </div>

              <button
                  className="primary-btn dashboard-report-btn"
                  onClick={openReportForm}
              >
                Report an Issue
                <span>→</span>
              </button>

            </section>

            <section className="activity-section">

              <div className="eyebrow">
                YOUR ACTIVITY
              </div>

              <div className="dashboard-grid">

                <div className="dashboard-card">
                <span className="card-label">
                  TOTAL REPORTS
                </span>

                  <strong>
                    {reports.length}
                  </strong>

                  <p>
                    Reports submitted by you
                  </p>
                </div>

                <div className="dashboard-card">
                <span className="card-label">
                  IN PROGRESS
                </span>

                  <strong>
                    {inProgressReports.length}
                  </strong>

                  <p>
                    Issues being handled
                  </p>
                </div>

                <div className="dashboard-card">
                <span className="card-label">
                  RESOLVED
                </span>

                  <strong>
                    {resolvedReports.length}
                  </strong>

                  <p>
                    Problems fixed
                  </p>
                </div>

              </div>
            </section>

            <section className="reports-section">

              <div className="reports-heading">

                <div>
                  <div className="eyebrow">
                    YOUR REPORTS
                  </div>

                  <h2>
                    Your civic reports
                  </h2>
                </div>

                <button
                    className="refresh-btn"
                    onClick={fetchMyReports}
                    disabled={loadingReports}
                >
                  {loadingReports ? 'Refreshing...' : 'Refresh'}
                </button>

              </div>

              {loadingReports ? (
                  <div className="reports-empty">
                    <div className="empty-icon">
                      ◌
                    </div>

                    <h3>
                      Loading your reports...
                    </h3>
                  </div>
              ) : reports.length === 0 ? (
                  <div className="reports-empty">

                    <div className="empty-icon">
                      ⌖
                    </div>

                    <h2>
                      Your civic reports will appear here
                    </h2>

                    <p>
                      Spot a problem around you? Submit it and keep track of what
                      happens next.
                    </p>

                    <button
                        className="primary-btn"
                        onClick={openReportForm}
                    >
                      Create First Report
                      <span>→</span>
                    </button>

                  </div>
              ) : (
                  <div className="reports-list">

                    {reports.map((report) => (
                        <article
                            className="report-card"
                            key={report.id}
                        >

                          <div className="report-card-top">

                            <div>
                        <span className="report-category">
                          {report.category || 'Civic Issue'}
                        </span>

                              <h3>
                                {report.title}
                              </h3>
                            </div>

                            <span
                                className={`status-badge ${String(
                                    report.status || ''
                                ).toLowerCase().replace(/\s+/g, '-')}`}
                            >
                        {report.status || 'PENDING'}
                      </span>

                          </div>

                          <p className="report-description">
                            {report.description}
                          </p>

                          <div className="report-details">

                      <span>
                        📍{' '}
                        {report.latitude && report.longitude
                            ? `${Number(report.latitude).toFixed(5)}, ${Number(
                                report.longitude
                            ).toFixed(5)}`
                            : 'Location not provided'}
                      </span>

                            {report.imageUrl && (
                                <a
                                    href={report.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                  View image
                                </a>
                            )}

                          </div>

                          <div className="report-card-bottom">

                      <span>
                        Report #{report.id}
                      </span>

                            <button
                                className="delete-btn"
                                onClick={() => deleteReport(report.id)}
                            >
                              Delete
                            </button>

                          </div>

                        </article>
                    ))}

                  </div>
              )}

            </section>

          </main>

          {showReport && (
              <div
                  className="report-overlay"
                  onClick={closeReportForm}
              >
                <div
                    className="report-modal"
                    onClick={(e) => e.stopPropagation()}
                >

                  <button
                      className="modal-close"
                      onClick={closeReportForm}
                      aria-label="Close"
                  >
                    ×
                  </button>

                  <div className="report-modal-header">

                    <div className="eyebrow">
                      NEW CIVIC REPORT
                    </div>

                    <h2>
                      Report an issue
                    </h2>

                    <p>
                      Tell us about the civic problem you noticed.
                    </p>

                  </div>

                  <form
                      className="report-form"
                      onSubmit={submitReport}
                  >

                    <div className="form-row">

                      <div className="form-group">
                        <label>
                          Issue title
                        </label>

                        <input
                            type="text"
                            name="title"
                            value={reportForm.title}
                            onChange={handleReportChange}
                            placeholder="e.g. Broken streetlight"
                            required
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          Category
                        </label>

                        <select
                            name="category"
                            value={reportForm.category}
                            onChange={handleReportChange}
                            required
                        >
                          <option value="">
                            Select a category
                          </option>
                          <option value="Roads">
                            Roads
                          </option>
                          <option value="Streetlight">
                            Streetlight
                          </option>
                          <option value="Waste Management">
                            Waste Management
                          </option>
                          <option value="Water Supply">
                            Water Supply
                          </option>
                          <option value="Drainage">
                            Drainage
                          </option>
                          <option value="Electricity">
                            Electricity
                          </option>
                          <option value="Public Safety">
                            Public Safety
                          </option>
                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </div>

                    </div>

                    <div className="form-group">
                      <label>
                        Location
                      </label>

                      <div className="location-input-row">

                        <input
                            type="text"
                            value={
                              reportForm.latitude && reportForm.longitude
                                  ? `${Number(reportForm.latitude).toFixed(5)}, ${Number(
                                      reportForm.longitude
                                  ).toFixed(5)}`
                                  : ''
                            }
                            placeholder="Use the button to detect your location"
                            readOnly
                        />

                        <button
                            type="button"
                            className="location-btn"
                            onClick={detectLocation}
                        >
                          📍 Detect My Location
                        </button>

                      </div>

                      {locationMessage && (
                          <small className="location-message">
                            {locationMessage}
                          </small>
                      )}

                    </div>

                    <div className="form-group">
                      <label>
                        Description
                      </label>

                      <textarea
                          name="description"
                          value={reportForm.description}
                          onChange={handleReportChange}
                          placeholder="Describe the problem in detail..."
                          rows="5"
                          required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Image URL
                      </label>

                      <input
                          type="url"
                          name="imageUrl"
                          value={reportForm.imageUrl}
                          onChange={handleReportChange}
                          placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {reportMessage && (
                        <div
                            className={`form-message ${
                                reportMessage.includes('successfully')
                                    ? 'success'
                                    : 'error'
                            }`}
                        >
                          {reportMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-report-btn"
                        disabled={isSubmittingReport}
                    >
                      {isSubmittingReport
                          ? 'Submitting...'
                          : 'Submit Report →'}
                    </button>

                  </form>

                </div>
              </div>
          )}
        </div>
    )
  }

  return (
      <div className="app">

        <nav className="navbar">

          <div className="brand">
            <div className="brand-mark">
              C
            </div>

            <span>
            CivicLens
          </span>
          </div>

          <div className="nav-links">

            <a href="#home">
              Home
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#about">
              About
            </a>

            <button
                className="nav-login"
                onClick={() => {
                  setShowLogin(true)
                  setLoginMessage('')
                }}
            >
              Login
            </button>

            <button
                className="nav-register"
                onClick={() => {
                  setShowLogin(true)
                  setLoginMessage('')
                }}
            >
              Get Started
            </button>

          </div>

        </nav>

        <main>

          <section
              className="hero-section"
              id="home"
          >

            <div className="hero-content">

              <div className="eyebrow">
                SMART CIVIC REPORTING PLATFORM
              </div>

              <h1>
                See a problem.
                <br />
                <span>
                Report it. Track it.
              </span>
              </h1>

              <p className="hero-text">
                CivicLens connects citizens with the people responsible for
                keeping our communities better, safer, and smarter.
              </p>

              <div className="hero-actions">

                <button
                    className="primary-btn"
                    onClick={() => setShowLogin(true)}
                >
                  Report an Issue
                  <span>→</span>
                </button>

                <button
                    className="secondary-btn"
                    onClick={() =>
                        document
                            .getElementById('how-it-works')
                            ?.scrollIntoView({
                              behavior: 'smooth'
                            })
                    }
                >
                  Explore Reports
                </button>

              </div>

              <div className="hero-stats">

                <div>
                  <strong>24/7</strong>
                  <span>Community reporting</span>
                </div>

                <div>
                  <strong>Real-time</strong>
                  <span>Status tracking</span>
                </div>

                <div>
                  <strong>One place</strong>
                  <span>For civic issues</span>
                </div>

              </div>

            </div>

            <div className="hero-visual">

              <div className="glow"></div>

              <div className="scan-card">

                <div className="scan-top">

                  <span className="live-dot"></span>

                  <span>
                  LIVE CIVIC SCAN
                </span>

                  <span className="scan-time">
                  19:42
                </span>

                </div>

                <div className="city-grid">

                  <div className="road road-one"></div>
                  <div className="road road-two"></div>

                  <div className="building b-one"></div>
                  <div className="building b-two"></div>
                  <div className="building b-three"></div>
                  <div className="building b-four"></div>

                  <div className="person">
                    <div className="head"></div>
                    <div className="body"></div>
                  </div>

                  <div className="scan-line"></div>

                  <div className="issue-pin pin-one">
                    !
                  </div>

                  <div className="issue-pin pin-two">
                    !
                  </div>

                </div>

                <div className="scan-bottom">

                  <div>
                    <span className="status-dot"></span>
                    Problem detected
                  </div>

                  <strong>
                    Street infrastructure
                  </strong>

                </div>

              </div>

              <div className="floating-card location-card">

              <span className="mini-icon">
                ⌖
              </span>

                <div>
                  <small>
                    LOCATION
                  </small>

                  <strong>
                    Near SRM Gate
                  </strong>
                </div>

              </div>

              <div className="floating-card verified-card">

              <span className="check">
                ✓
              </span>

                <div>
                  <small>
                    STATUS
                  </small>

                  <strong>
                    Report tracked
                  </strong>
                </div>

              </div>

            </div>

          </section>

          <section
              className="feature-section"
              id="how-it-works"
          >

            <div className="section-heading">

              <div className="eyebrow">
                HOW CIVICLENS WORKS
              </div>

              <h2>
                From observation to resolution.
              </h2>

              <p>
                Turn everyday civic problems into visible, trackable action.
              </p>

            </div>

            <div className="steps">

              <article className="step-card">

                <div className="step-number">
                  01
                </div>

                <div className="step-icon">
                  ⌕
                </div>

                <h3>
                  Spot the problem
                </h3>

                <p>
                  Notice a broken streetlight, damaged road, overflowing waste,
                  or another civic issue.
                </p>

              </article>

              <article className="step-card featured-step">

                <div className="step-number">
                  02
                </div>

                <div className="step-icon">
                  ↗
                </div>

                <h3>
                  Report it
                </h3>

                <p>
                  Submit the issue with a title, description, location,
                  category, and supporting image.
                </p>

              </article>

              <article className="step-card">

                <div className="step-number">
                  03
                </div>

                <div className="step-icon">
                  ✓
                </div>

                <h3>
                  Track progress
                </h3>

                <p>
                  Follow the report as authorities review, work on, and resolve
                  the problem.
                </p>

              </article>

            </div>

          </section>

          <section
              className="mission-section"
              id="about"
          >

            <div>

              <div className="eyebrow">
                OUR MISSION
              </div>

              <h2>
                A clearer lens on the places we call home.
              </h2>

            </div>

            <p>
              CivicLens is designed to make civic participation simple and
              transparent. Citizens can raise issues, while administrators can
              manage reports and update their status through one connected
              platform.
            </p>

          </section>

        </main>

        <footer>

          <div className="brand">
            <div className="brand-mark">
              C
            </div>

            <span>
            CivicLens
          </span>
          </div>

          <p>
            Building better communities, one report at a time.
          </p>

        </footer>

        {showLogin && (

            <div
                className="login-overlay"
                onClick={() => setShowLogin(false)}
            >

              <div
                  className="login-card"
                  onClick={(e) => e.stopPropagation()}
              >

                <button
                    className="login-close"
                    onClick={() => setShowLogin(false)}
                >
                  ×
                </button>

                <div className="login-badge">
                  CIVICLENS
                </div>

                <h2>
                  Welcome back
                </h2>

                <p>
                  Sign in to report and track civic problems.
                </p>

                <form onSubmit={handleLogin}>

                  <label>
                    Email
                  </label>

                  <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                  />

                  <label>
                    Password
                  </label>

                  <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                  />

                  <button
                      type="submit"
                      className="login-submit"
                      disabled={isLoggingIn}
                  >
                    {isLoggingIn
                        ? 'Signing in...'
                        : 'Sign In'}
                  </button>

                </form>

                {loginMessage && (
                    <div className="login-message">
                      {loginMessage}
                    </div>
                )}

              </div>

            </div>

        )}

      </div>
  )
}

export default App