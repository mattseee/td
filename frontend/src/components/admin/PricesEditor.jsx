'use client'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import Button from '@/components/ui/Button'

export default function PricesEditor({ prices, onChange }) {
  const [branches, setBranches] = useState([])

  useEffect(() => {
    api.get('/api/branches').then(r => setBranches(r.data.data || [])).catch(() => {})
  }, [])

  function addPrice() {
    onChange([...prices, { branch_id: '', price: '', discount_price: '', valid_from: '', valid_to: '' }])
  }

  function updatePrice(idx, field, value) {
    const updated = prices.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    onChange(updated)
  }

  function removePrice(idx) {
    onChange(prices.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {prices.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Филиал', 'Цена', 'Скидочная цена', 'Дата от', 'Дата до', ''].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 10px' }}>
                    <select value={p.branch_id} onChange={e => updatePrice(idx, 'branch_id', e.target.value)} style={selectStyle}>
                      <option value="">— выбрать —</option>
                      {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.NAME} ({b.city})</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="number" min="0" step="0.01" value={p.price} onChange={e => updatePrice(idx, 'price', e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="0.00" />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="number" min="0" step="0.01" value={p.discount_price} onChange={e => updatePrice(idx, 'discount_price', e.target.value)} style={{ ...inputStyle, width: 100 }} placeholder="—" />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="date" value={p.valid_from} onChange={e => updatePrice(idx, 'valid_from', e.target.value)} style={{ ...inputStyle, width: 130 }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input type="date" value={p.valid_to} onChange={e => updatePrice(idx, 'valid_to', e.target.value)} style={{ ...inputStyle, width: 130 }} />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <button type="button" onClick={() => removePrice(idx)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={addPrice}>
        + Добавить цену для филиала
      </Button>
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '6px 10px',
  color: 'var(--text)',
  fontSize: 13,
}

const selectStyle = {
  ...inputStyle,
  width: '100%',
}
