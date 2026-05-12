'use client'
import { useState, useRef, useCallback } from 'react'

export default function BeforeAfterSlider({ before, after, height = 320 }) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  const onMouseDown = (e) => {
    dragging.current = true
    updatePosition(e.clientX)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const onTouchMove = (e) => {
    updatePosition(e.touches[0].clientX)
  }

  const placeholderSrc = '/images/masters/placeholder_before.jpg'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', height, borderRadius: 10,
        overflow: 'hidden', cursor: 'col-resize', userSelect: 'none',
        border: '1px solid var(--border)',
      }}
      onMouseDown={onMouseDown}
      onTouchMove={onTouchMove}
    >
      {/* After image (full background) */}
      <img
        src={after || placeholderSrc}
        alt="После"
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { e.target.src = placeholderSrc }}
      />

      {/* Before image (clipped) */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `inset(0 ${100 - position}% 0 0)`,
      }}>
        <img
          src={before || placeholderSrc}
          alt="До"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = placeholderSrc }}
        />
      </div>

      {/* Divider */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${position}%`, transform: 'translateX(-50%)',
        width: 3, background: 'var(--accent)', zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--accent)', border: '3px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontWeight: 700,
        }}>
          ↔
        </div>
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(15,17,23,0.8)', borderRadius: 4,
        padding: '3px 10px', fontSize: 11, fontWeight: 700,
        color: 'var(--text)', pointerEvents: 'none',
      }}>ДО</div>
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(245,166,35,0.9)', borderRadius: 4,
        padding: '3px 10px', fontSize: 11, fontWeight: 700,
        color: '#fff', pointerEvents: 'none',
      }}>ПОСЛЕ</div>
    </div>
  )
}
