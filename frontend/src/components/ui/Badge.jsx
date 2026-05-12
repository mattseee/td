'use client'

const presets = {
  exclusive: { bg: 'var(--badge-exclusive-bg)', color: 'var(--badge-exclusive-text)' },
  hit:       { bg: 'var(--badge-hit-bg)',       color: 'var(--badge-hit-text)' },
  promo:     { bg: 'var(--badge-promo-bg)',      color: 'var(--badge-promo-text)' },
  discount:  { bg: 'var(--badge-sale-bg)',       color: 'var(--badge-sale-text)' },
  success:   { bg: 'var(--success-soft)',        color: 'var(--success)' },
  info:      { bg: 'var(--accent-soft)',         color: 'var(--accent-text)' },
  danger:    { bg: 'var(--danger-soft)',         color: 'var(--danger)' },
  muted:     { bg: 'var(--surface-2)',           color: 'var(--text-muted)' },
}

export default function Badge({ children, variant = 'muted', style }) {
  const preset = presets[variant] || presets.muted
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        background: preset.bg,
        color: preset.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.6,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
