'use client'

const STATUS_MAP = {
  pending:    { label: 'Ожидает',   color: 'var(--accent)' },
  processing: { label: 'В работе',  color: 'var(--info)' },
  completed:  { label: 'Выполнен',  color: 'var(--success)' },
  cancelled:  { label: 'Отменён',   color: 'var(--danger)' },
}

export default function OrderStatusBadge({ status }) {
  const st = STATUS_MAP[status] || STATUS_MAP.pending
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
      background: st.color + '22', color: st.color,
      whiteSpace: 'nowrap',
    }}>
      {st.label}
    </span>
  )
}
