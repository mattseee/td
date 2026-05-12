'use client'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Новинки' },
  { value: 'rating',     label: 'По рейтингу' },
  { value: 'price_asc',  label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
]

export default function SortBar({ sort, view, total, onSortChange, onViewChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {total != null && <span>Найдено: <strong style={{ color: 'var(--text)' }}>{total}</strong></span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Сортировка:</span>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6,
            padding: '6px 12px', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {[['grid', '⊞'], ['list', '☰']].map(([v, icon]) => (
            <button key={v} onClick={() => onViewChange(v)} style={{
              width: 34, height: 34, background: view === v ? 'var(--surface-2)' : 'none',
              border: 'none', cursor: 'pointer', color: view === v ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{icon}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
