'use client'

const variants = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
  },
  danger: {
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
  },
}

export default function Button({
  children, variant = 'primary', size = 'md', disabled, onClick,
  type = 'button', fullWidth, style, className,
}) {
  const v = variants[variant] || variants.primary
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 32px' : '10px 22px'
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...v,
        padding: pad,
        fontSize,
        fontWeight: 500,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s, transform 0.1s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent-hover)'
        else if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-2)'
        else if (variant === 'ghost') e.currentTarget.style.color = 'var(--accent)'
      }}
      onMouseLeave={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.background = 'var(--accent)'
        else if (variant === 'secondary') e.currentTarget.style.background = 'transparent'
        else if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-muted)'
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = '' }}
    >
      {children}
    </button>
  )
}
