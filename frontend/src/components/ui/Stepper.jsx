'use client'

export default function Stepper({ value = 1, min = 1, max = 999, onChange }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={stepBtn(value <= min)}
      >−</button>
      <span style={{ minWidth: 40, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={stepBtn(value >= max)}
      >+</button>
    </div>
  )
}

function stepBtn(disabled) {
  return {
    width: 36, height: 36,
    background: 'var(--surface-2)',
    border: 'none',
    color: disabled ? 'var(--text-muted)' : 'var(--text)',
    fontSize: 18,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  }
}
