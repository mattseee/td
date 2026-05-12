'use client'

import { forwardRef } from 'react'

const Input = forwardRef(function Input({
  label, error, icon, iconRight, type = 'text', placeholder,
  value, onChange, onFocus, onBlur, style, inputStyle, ...rest
}, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && (
        <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 6,
            padding: `9px ${iconRight ? 36 : 12}px 9px ${icon ? 36 : 12}px`,
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.15s',
            ...inputStyle,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; onFocus?.(e) }}
          onBlur={e => { e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'; onBlur?.(e) }}
          {...rest}
        />
        {iconRight && (
          <span style={{ position: 'absolute', right: 10, color: 'var(--text-muted)', display: 'flex' }}>
            {iconRight}
          </span>
        )}
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
})

export default Input
