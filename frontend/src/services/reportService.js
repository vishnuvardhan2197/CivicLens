import api from './api'

export const reportService = {
  // Citizen: Create report
  async createReport(reportData) {
    const response = await api.post('/reports', reportData)
    return response.data
  },

  // Citizen: Get own reports
  async getMyReports() {
    const response = await api.get('/reports/my')
    return response.data
  },

  // Get report by ID
  async getReportById(id) {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  // Get report history
  async getReportHistory(id) {
    const response = await api.get(`/reports/${id}/history`)
    return response.data
  },

  // Citizen: Delete report (PENDING only)
  async deleteReport(id) {
    const response = await api.delete(`/reports/${id}`)
    return response.data
  },

  // Admin: Get all reports (with optional filtering and pagination)
  async getAllReports(params = {}) {
    const response = await api.get('/reports', { params })
    return response.data
  },

  // Admin: Assign report to department and staff
  async assignReport(id, assignData) {
    const response = await api.put(`/reports/${id}/assign`, assignData)
    return response.data
  },

  // Admin: Update priority
  async updatePriority(id, priority) {
    const response = await api.put(`/reports/${id}/priority`, { priority })
    return response.data
  },

  // Admin / Staff: Update status
  async updateStatus(id, status, remarks) {
    const response = await api.put(`/reports/${id}/status`, { status, remarks })
    return response.data
  },

  // Staff: Get assigned reports
  async getStaffAssignedReports() {
    const response = await api.get('/reports/staff/assigned')
    return response.data
  },

  // Staff: Get single report
  async getStaffReportById(id) {
    const response = await api.get(`/reports/staff/${id}`)
    return response.data
  },

  // Staff: Update progress and upload proof
  async updateStaffProgress(id, updateData) {
    const response = await api.put(`/reports/${id}/staff-update`, updateData)
    return response.data
  },

  // Upload image (multipart/form-data)
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data // { success: true, imageUrl: '/uploads/...', message: '...' }
  },
}

export default reportService
