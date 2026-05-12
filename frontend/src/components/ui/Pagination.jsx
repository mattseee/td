'use client'

export default function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        style={btnStyle(false, page === 1)}
      >←</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={i} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={btnStyle(p === page, false)}
          >{p}</button>
        )
      )}
      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        style={btnStyle(false, page === totalPages)}
      >→</button>
    </div>
  )
}

function btnStyle(active, disabled) {
  return {
    width: 36, height: 36,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 6,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#0F1117' : disabled ? 'var(--text-muted)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: active ? 700 : 400,
    fontSize: 14,
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
  }
}
