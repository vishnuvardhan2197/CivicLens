import api from './api'

export const notificationService = {
  async getNotifications() {
    const response = await api.get('/notifications')
    return response.data
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count')
    return response.data // { unreadCount: N }
  },

  async markAsRead(id) {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all')
    return response.data
  },

  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },
}

export default notificationService
