export function StatusBadge({ status, type = 'status', className = '' }) {
  if (!status) return null

  const normalized = status.toUpperCase().replace(/\s+/g, '_')

  if (type === 'priority') {
    const priorityConfig = {
      LOW: { label: 'Low', className: 'badge-priority-low' },
      MEDIUM: { label: 'Medium', className: 'badge-priority-medium' },
      HIGH: { label: 'High', className: 'badge-priority-high' },
      EMERGENCY: { label: 'Emergency', className: 'badge-priority-emergency' },
    }
    const config = priorityConfig[normalized] || { label: status, className: 'badge-default' }
    return <span className={`badge ${config.className} ${className}`}>{config.label}</span>
  }

  if (type === 'role') {
    const roleConfig = {
      CITIZEN: { label: 'Citizen', className: 'badge-role-citizen' },
      MUNICIPAL_STAFF: { label: 'Municipal Staff', className: 'badge-role-staff' },
      ADMIN: { label: 'Administrator', className: 'badge-role-admin' },
    }
    const config = roleConfig[normalized] || { label: status, className: 'badge-default' }
    return <span className={`badge ${config.className} ${className}`}>{config.label}</span>
  }

  // Default: complaint status
  const statusConfig = {
    PENDING: { label: 'Pending', className: 'badge-status-pending' },
    ASSIGNED: { label: 'Assigned', className: 'badge-status-assigned' },
    IN_PROGRESS: { label: 'In Progress', className: 'badge-status-in-progress' },
    RESOLVED: { label: 'Resolved', className: 'badge-status-resolved' },
    REJECTED: { label: 'Rejected', className: 'badge-status-rejected' },
  }

  const config = statusConfig[normalized] || { label: status, className: 'badge-default' }
  return <span className={`badge ${config.className} ${className}`}>{config.label}</span>
}

export default StatusBadge
