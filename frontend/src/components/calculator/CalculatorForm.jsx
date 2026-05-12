'use client'
import { useState } from 'react'
import { CALCULATORS } from '@/data/calculator'
import Button from '@/components/ui/Button'

export default function CalculatorForm({ calcId, onCalculate }) {
  const calc = CALCULATORS[calcId]
  const [values, setValues] = useState(() => {
    const defaults = {}
    calc.inputs.forEach(inp => { defaults[inp.id] = inp.defaultValue ?? '' })
    return defaults
  })

  const handleChange = (id, value) => setValues(v => ({ ...v, [id]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const results = calc.calculate(values)
    onCalculate(results, values)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {calc.inputs.map(inp => (
          <div key={inp.id}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              {inp.label}
            </label>
            {inp.type === 'number' && (
              <input
                type="number"
                min={inp.min}
                max={inp.max}
                step={inp.step || 1}
                value={values[inp.id]}
                onChange={e => handleChange(inp.id, e.target.value)}
                required
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 6,
                  padding: '10px 14px', fontSize: 15, color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            )}
            {inp.type === 'select' && (
              <select
                value={values[inp.id]}
                onChange={e => handleChange(inp.id, e.target.value)}
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 6,
                  padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                  outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
                }}
              >
                {inp.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      <Button type="submit" size="lg" fullWidth style={{ marginTop: 24 }}>
        Рассчитать
      </Button>
    </form>
  )
}
