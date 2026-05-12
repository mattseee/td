'use client'
import Button from '@/components/ui/Button'

export default function SpecificationsEditor({ specs, onChange }) {
  function addSpec() {
    onChange([...specs, { NAME: '', VALUE: '', unit: '' }])
  }

  function updateSpec(idx, field, value) {
    const updated = specs.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange(updated)
  }

  function removeSpec(idx) {
    onChange(specs.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {specs.map((spec, idx) => (
        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input
            placeholder="Название"
            value={spec.NAME}
            onChange={e => updateSpec(idx, 'NAME', e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Значение"
            value={spec.VALUE}
            onChange={e => updateSpec(idx, 'VALUE', e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Ед. изм."
            value={spec.unit}
            onChange={e => updateSpec(idx, 'unit', e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => removeSpec(idx)}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addSpec}>
        + Добавить характеристику
      </Button>
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
}
