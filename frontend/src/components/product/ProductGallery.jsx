'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getImageUrl } from '@/utils/getImageUrl'

export default function ProductGallery({ media = [] }) {
  const images = media.filter(m => m.TYPE === 'image')
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(0)

  if (!images.length) {
    return (
      <div style={{ aspectRatio: '1/1', maxWidth: 600, background: 'var(--surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Нет фото
      </div>
    )
  }

  const goTo = (idx) => {
    setDirection(idx > activeIdx ? 1 : -1)
    setActiveIdx(idx)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: 'var(--surface-2)', aspectRatio: '1/1', maxWidth: 600 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={activeIdx}
            src={getImageUrl(images[activeIdx]?.url)}
            alt="Фото товара"
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
            onError={e => { e.target.src = '/images/placeholder.jpg' }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button onClick={() => goTo((activeIdx - 1 + images.length) % images.length)} style={arrowBtn('left')}>‹</button>
            <button onClick={() => goTo((activeIdx + 1) % images.length)} style={arrowBtn('right')}>›</button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: 64, height: 64, padding: 0, border: `2px solid ${i === activeIdx ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: 'none', flexShrink: 0,
            }}>
              <img src={getImageUrl(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = '/images/placeholder.jpg' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function arrowBtn(side) {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: 8,
    background: 'rgba(15,17,23,0.7)', border: 'none', borderRadius: '50%',
    width: 36, height: 36, fontSize: 22, color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  }
}
