'use client'
import { useEffect } from 'react'
import useUiStore from '@/store/uiStore'

const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)', warning: 'var(--accent)' }

function ToastItem({ id, message, type }) {
  const removeToast = useUiStore(s => s.removeToast)
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'var(--surface-2)', border: `1px solid ${colors[type] || colors.info}`,
        borderLeft: `4px solid ${colors[type] || colors.info}`,
        borderRadius: 8, padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        minWidth: 260, maxWidth: 380,
        animation: 'toast-in 0.25s ease',
      }}
    >
      <span style={{ color: colors[type] || colors.info, fontSize: 16, flexShrink: 0, fontWeight: 700 }}>
        {icons[type] || icons.info}
      </span>
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={() => removeToast(id)}
        aria-label="Закрыть уведомление"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0, flexShrink: 0, minWidth: 24, minHeight: 24 }}
      >×</button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useUiStore(s => s.toasts)
  if (!toasts.length) return null
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {toasts.map(t => <ToastItem key={t.id} {...t} />)}
    </div>
  )
}
