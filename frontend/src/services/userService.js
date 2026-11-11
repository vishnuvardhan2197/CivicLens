import api from './api'

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  async getUserById(id) {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  async createStaff(staffData) {
    const response = await api.post('/admin/staff', staffData)
    return response.data
  },

  async updateUserRole(id, role) {
    const response = await api.put(`/admin/users/${id}/role`, { role })
    return response.data
  },

  async updateUserStatus(id, active) {
    const response = await api.put(`/admin/users/${id}/status`, { active })
    return response.data
  },

  async getAllStaff() {
    const response = await api.get('/users/staff')
    return response.data
  },
}

export default userService
