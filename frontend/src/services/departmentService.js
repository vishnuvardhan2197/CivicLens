import api from './api'

export const departmentService = {
  async getAllDepartments(activeOnly = false) {
    const response = await api.get('/departments', {
      params: { activeOnly },
    })
    return response.data
  },

  async getDepartmentById(id) {
    const response = await api.get(`/departments/${id}`)
    return response.data
  },

  async createDepartment(departmentData) {
    const response = await api.post('/departments', departmentData)
    return response.data
  },

  async updateDepartment(id, departmentData) {
    const response = await api.put(`/departments/${id}`, departmentData)
    return response.data
  },

  async deleteDepartment(id) {
    const response = await api.delete(`/departments/${id}`)
    return response.data
  },
}

export default departmentService
