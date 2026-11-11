import api from './api'

export const analyticsService = {
  async getSummary() {
    const response = await api.get('/analytics/summary')
    return response.data
  },

  async getCategories() {
    const response = await api.get('/analytics/categories')
    return response.data
  },

  async getDepartments() {
    const response = await api.get('/analytics/departments')
    return response.data
  },

  async getMonthly() {
    const response = await api.get('/analytics/monthly')
    return response.data
  },
}

export default analyticsService
