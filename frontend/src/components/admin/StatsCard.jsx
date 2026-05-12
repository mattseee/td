'use client'

export default function StatsCard({ title, value, Icon, color = 'var(--accent)' }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {Icon && (
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: color + '22',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={24} color={color} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontWeight: 700 }}>
          {value}
        </div>
      </div>
    </div>
  )
}
