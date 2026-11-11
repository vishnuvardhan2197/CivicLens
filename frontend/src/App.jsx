import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PortalLayout from './components/PortalLayout'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Public Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// Citizen Portal Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import CreateReport from './pages/citizen/CreateReport'
import MyReports from './pages/citizen/MyReports'
import ReportDetails from './pages/citizen/ReportDetails'
import CitizenProfile from './pages/citizen/CitizenProfile'
import CitizenMap from './pages/citizen/CitizenMap'

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageReports from './pages/admin/ManageReports'
import ManageUsers from './pages/admin/ManageUsers'
import ManageDepartments from './pages/admin/ManageDepartments'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminMap from './pages/admin/AdminMap'

// Staff Portal Pages
import StaffDashboard from './pages/staff/StaffDashboard'
import AssignedReports from './pages/staff/AssignedReports'
import StaffReportDetails from './pages/staff/StaffReportDetails'
import StaffMap from './pages/staff/StaffMap'

import './App.css'

// Layout wrapper for public pages
function PublicLayout({ children }) {
  return (
    <div className="public-wrapper">
      <Navbar />
      <main className="public-content">{children}</main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register />
              </PublicLayout>
            }
          />

          {/* Citizen Routes */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <CitizenDashboard />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/create-report"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <CreateReport />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/my-reports"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <MyReports />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/reports/:id"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <ReportDetails />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/profile"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <CitizenProfile />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/map"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                <PortalLayout>
                  <CitizenMap />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <AdminDashboard />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <ManageReports />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <ManageUsers />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <ManageDepartments />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <AdminAnalytics />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/map"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PortalLayout>
                  <AdminMap />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Municipal Staff Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['MUNICIPAL_STAFF', 'ADMIN']}>
                <PortalLayout>
                  <StaffDashboard />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/assigned-reports"
            element={
              <ProtectedRoute allowedRoles={['MUNICIPAL_STAFF', 'ADMIN']}>
                <PortalLayout>
                  <AssignedReports />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reports/:id"
            element={
              <ProtectedRoute allowedRoles={['MUNICIPAL_STAFF', 'ADMIN']}>
                <PortalLayout>
                  <StaffReportDetails />
                </PortalLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/map"
            element={
              <ProtectedRoute allowedRoles={['MUNICIPAL_STAFF', 'ADMIN']}>
                <PortalLayout>
                  <StaffMap />
                </PortalLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route
            path="*"
            element={
              <PublicLayout>
                <NotFound />
              </PublicLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
