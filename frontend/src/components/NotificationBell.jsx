import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import notificationService from '../services/notificationService'
import { useAuth } from '../context/AuthContext'

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount()
      setUnreadCount(data.unreadCount || 0)
    } catch (e) {
      console.error('Failed to fetch unread count:', e)
    }
  }, [])

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data || [])
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const checkCount = async () => {
      try {
        const data = await notificationService.getUnreadCount()
        if (isMounted) {
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (e) {
        console.error('Failed to fetch unread count:', e)
      }
    }

    checkCount()
    const interval = setInterval(checkCount, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      fetchUnreadCount()
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getReportUrl = (reportId) => {
    if (!user) return '#'
    if (user.role === 'ADMIN') return `/admin/reports`
    if (user.role === 'MUNICIPAL_STAFF') return `/staff/reports/${reportId}`
    return `/citizen/reports/${reportId}`
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={handleToggle}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-count-tag">{unreadCount} new</span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn-mark-all"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="notification-body">
            {loading ? (
              <div className="notification-empty">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={32} className="text-slate-300 mx-auto mb-2" />
                <p>No notifications yet</p>
                <span className="text-xs text-slate-400">Updates will appear here</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const isRead = notif.isRead || notif.read
                const reportId = notif.relatedReport ? notif.relatedReport.id : null

                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${!isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-item-content">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="notification-item-title">{notif.title}</h4>
                        <div className="notification-actions">
                          {!isRead && (
                            <button
                              type="button"
                              className="btn-action-read"
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              title="Mark read"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={(e) => handleDelete(notif.id, e)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="notification-item-message">{notif.message}</p>
                      <div className="notification-item-footer">
                        <span className="notification-time">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : ''}
                        </span>
                        {reportId && (
                          <Link
                            to={getReportUrl(reportId)}
                            className="notification-link"
                            onClick={() => setIsOpen(false)}
                          >
                            <span>View Complaint #{reportId}</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
