import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../utils/ticketUtils'

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-600'}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  )
}
