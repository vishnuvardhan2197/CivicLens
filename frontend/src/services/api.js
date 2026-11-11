import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civiclens_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest.url.includes('/auth/login')
    ) {
      // Clear token and user on expired/invalid token
      localStorage.removeItem('civiclens_token')
      localStorage.removeItem('civiclens_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session=expired'
      }
    }
    return Promise.reject(error)
  }
)

export { API_BASE_URL }
export default api
