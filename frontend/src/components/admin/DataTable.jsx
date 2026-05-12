'use client'
import { useState } from 'react'

export default function DataTable({ columns, data, onRowClick, emptyText = 'Нет данных' }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (!key) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = typeof av === 'string' ? av.localeCompare(bv, 'ru') : av - bv
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th
                key={col.key || col.label}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={row.id ?? row.product_id ?? row.order_id ?? row.user_id ?? row.category_id ?? row.promotion_id ?? idx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '' }}
              >
                {columns.map(col => (
                  <td key={col.key || col.label} style={{ padding: '12px 14px', color: 'var(--text)', verticalAlign: 'middle' }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
