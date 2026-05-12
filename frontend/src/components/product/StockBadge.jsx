'use client'
import { useState } from 'react'

export default function StockBadge({ stock = [], city }) {
  const [showBranches, setShowBranches] = useState(false)

  const cityStock = city
    ? stock.filter(s => s.city === city)
    : stock

  const inStockBranches = cityStock.filter(s => s.quantity > 0)
  const totalQty = inStockBranches.reduce((sum, s) => sum + s.quantity, 0)
  const lowStock = totalQty > 0 && totalQty <= 5

  if (!city) {
    const anyInStock = stock.some(s => s.quantity > 0)
    return (
      <span style={{ fontSize: 12, color: anyInStock ? 'var(--success)' : 'var(--text-muted)' }}>
        {anyInStock ? 'Есть в наличии' : 'Нет в наличии'}
      </span>
    )
  }

  if (inStockBranches.length === 0) {
    return (
      <div>
        <span style={{ fontSize: 12, color: 'var(--danger)' }}>Нет в наличии в {city}</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setShowBranches(!showBranches)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: lowStock ? 'var(--accent)' : 'var(--success)', display: 'inline-block' }} />
        <span style={{ fontSize: 13, color: lowStock ? 'var(--accent)' : 'var(--success)', fontWeight: 500 }}>
          {lowStock ? `Осталось ${totalQty} шт` : `В наличии в ${inStockBranches.length} магазинах`}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)' }}>
          <polyline points={showBranches ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
        </svg>
      </button>

      {showBranches && (
        <div style={{ marginTop: 8, background: 'var(--surface-2)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {inStockBranches.map(s => (
            <div key={s.branch_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <div>
                <div style={{ color: 'var(--text)', fontWeight: 500 }}>{s.branch_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>{s.address}</div>
              </div>
              <span style={{ color: s.quantity <= 5 ? 'var(--accent)' : 'var(--success)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                {s.quantity <= 5 ? `${s.quantity} шт` : 'В наличии'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
