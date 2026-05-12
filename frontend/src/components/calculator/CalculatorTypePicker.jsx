'use client'
import { CALCULATORS } from '@/data/calculator'

export default function CalculatorTypePicker({ selected, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
      {Object.values(CALCULATORS).map(calc => (
        <button
          key={calc.id}
          onClick={() => onSelect(calc.id)}
          style={{
            background: selected === calc.id ? 'var(--accent)' : 'var(--surface)',
            border: `2px solid ${selected === calc.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '20px 12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
            color: selected === calc.id ? '#0F1117' : 'var(--text)',
          }}
          onMouseEnter={e => {
            if (selected !== calc.id) {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'var(--surface-2)'
            }
          }}
          onMouseLeave={e => {
            if (selected !== calc.id) {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--surface)'
            }
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>{calc.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{calc.name}</div>
          {calc.description && (
            <div style={{
              fontSize: 11,
              color: selected === calc.id ? 'rgba(15,17,23,0.7)' : 'var(--text-muted)',
              marginTop: 6, lineHeight: 1.4,
            }}>
              {calc.description.substring(0, 50)}...
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
