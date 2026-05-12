'use client'
import { useState, useEffect } from 'react'

export default function RangeSlider({ min = 0, max = 100000, value, onChange, step = 100 }) {
  const [localMin, setLocalMin] = useState(value?.[0] ?? min)
  const [localMax, setLocalMax] = useState(value?.[1] ?? max)

  useEffect(() => {
    setLocalMin(value?.[0] ?? min)
    setLocalMax(value?.[1] ?? max)
  }, [value, min, max])

  const handleMinChange = (e) => {
    const v = Math.min(parseInt(e.target.value), localMax - step)
    setLocalMin(v)
    onChange?.([v, localMax])
  }
  const handleMaxChange = (e) => {
    const v = Math.max(parseInt(e.target.value), localMin + step)
    setLocalMax(v)
    onChange?.([localMin, v])
  }

  const pctMin = ((localMin - min) / (max - min)) * 100
  const pctMax = ((localMax - min) / (max - min)) * 100

  return (
    <div style={{ padding: '8px 0' }}>
      <style>{`
        .range-slider input[type=range] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          width: 100%;
          height: 4px;
          cursor: pointer;
        }
        .range-slider input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--bg);
          margin-top: -6px;
        }
        .range-slider input[type=range]::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: var(--border);
        }
      `}</style>
      <div className="range-slider" style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 18, left: 0, right: 0, height: 4,
          borderRadius: 2, background: 'var(--border)',
        }}>
          <div style={{
            position: 'absolute',
            left: `${pctMin}%`, right: `${100 - pctMax}%`,
            height: '100%', background: 'var(--accent)', borderRadius: 2,
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={localMin}
          onChange={handleMinChange}
          style={{ position: 'relative', zIndex: 3 }}
        />
        <input
          type="range" min={min} max={max} step={step} value={localMax}
          onChange={handleMaxChange}
          style={{ position: 'relative', zIndex: 4, marginTop: -4 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>от {localMin.toLocaleString('ru-RU')} ₽</span>
        <span>до {localMax.toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>
  )
}
