'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 480 }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus dialog on open
    const t = setTimeout(() => dialogRef.current?.focus(), 10)

    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Диалоговое окно'}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: '100%', maxWidth,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          outline: 'none',
        }}
      >
        {(title || onClose) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {title && (
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              aria-label="Закрыть"
              style={{
                marginLeft: 'auto', background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, width: 32, height: 32, cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
