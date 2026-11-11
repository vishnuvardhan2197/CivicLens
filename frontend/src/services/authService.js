import api from './api'

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/users/me')
    return response.data
  },

  logout() {
    localStorage.removeItem('civiclens_token')
    localStorage.removeItem('civiclens_user')
  },
}

export default authService
