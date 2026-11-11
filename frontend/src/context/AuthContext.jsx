/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on application load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('civiclens_token')
      const storedUser = localStorage.getItem('civiclens_user')

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(parsedUser)

          // Background verification and refresh of user profile
          try {
            const freshUser = await authService.getCurrentUser()
            const updatedUser = {
              ...parsedUser,
              name: freshUser.name || parsedUser.name,
              email: freshUser.email || parsedUser.email,
              role: freshUser.role || parsedUser.role,
              department: freshUser.department || parsedUser.department,
              phone: freshUser.phone || parsedUser.phone,
            }
            setUser(updatedUser)
            localStorage.setItem('civiclens_user', JSON.stringify(updatedUser))
          } catch (verifyErr) {
            if (verifyErr.response && verifyErr.response.status === 401) {
              setToken(null)
              setUser(null)
            }
          }
        } catch (e) {
          console.error('Failed to parse cached user:', e)
          localStorage.removeItem('civiclens_token')
          localStorage.removeItem('civiclens_user')
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  // Login handler
  const login = async (email, password) => {
    const data = await authService.login(email, password)
    const loggedInUser = {
      id: data.userId,
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
    }

    localStorage.setItem('civiclens_token', data.token)
    localStorage.setItem('civiclens_user', JSON.stringify(loggedInUser))

    setToken(data.token)
    setUser(loggedInUser)

    return loggedInUser
  }

  // Register citizen handler
  const register = async (userData) => {
    const registeredUser = await authService.register(userData)
    return registeredUser
  }

  // Logout handler
  const logout = useCallback(() => {
    authService.logout()
    setToken(null)
    setUser(null)
  }, [])

  // Role helpers
  const isAuthenticated = !!token && !!user
  const role = user ? user.role : null
  const isCitizen = role === 'CITIZEN'
  const isAdmin = role === 'ADMIN'
  const isStaff = role === 'MUNICIPAL_STAFF'

  const hasRole = (allowedRoles) => {
    if (!role) return false
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(role)
    }
    return role === allowedRoles
  }

  // Helper to get role-appropriate home dashboard path
  const getRoleDashboardPath = (userRole = role) => {
    switch (userRole) {
      case 'ADMIN':
        return '/admin/dashboard'
      case 'MUNICIPAL_STAFF':
        return '/staff/dashboard'
      case 'CITIZEN':
      default:
        return '/citizen/dashboard'
    }
  }

  const value = {
    user,
    token,
    role,
    loading,
    isAuthenticated,
    isCitizen,
    isAdmin,
    isStaff,
    hasRole,
    getRoleDashboardPath,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
