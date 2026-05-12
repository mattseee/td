'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'

const PROJECT_TYPES = [
  { value: 'repair', label: 'Ремонт квартиры/дома' },
  { value: 'construction', label: 'Строительство' },
  { value: 'dacha', label: 'Дача/Загородный дом' },
  { value: 'commercial', label: 'Коммерческий объект' },
]

export default function ProjectForm({ onSubmit, onCancel, initialValues = {} }) {
  const [name, setName] = useState(initialValues.name || '')
  const [type, setType] = useState(initialValues.type || 'repair')
  const [budget, setBudget] = useState(initialValues.budget || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), type, budget: parseFloat(budget) || 0 })
  }

  const inputStyle = {
    width: '100%', background: 'var(--surface-2)',
    border: '1px solid var(--border)', borderRadius: 6,
    padding: '10px 14px', fontSize: 14, color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: 6,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Название проекта *</label>
        <input
          type="text"
          placeholder="Ремонт кухни..."
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Тип проекта</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {PROJECT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Бюджет, ₽ (необязательно)</label>
        <input
          type="number"
          placeholder="0"
          min="0"
          step="1000"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          style={{ ...inputStyle,  }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="submit" fullWidth>Сохранить</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Отмена</Button>
        )}
      </div>
    </form>
  )
}
