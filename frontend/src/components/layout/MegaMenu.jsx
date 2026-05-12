'use client'
import { useState } from 'react'
import Link from 'next/link'

// Desktop: full-width mega menu, 4-column grid
export function MegaMenuDesktop({ categories, onClose }) {
  const roots = categories.filter(c => !c.parent_id)
  const [hoveredRoot, setHoveredRoot] = useState(roots[0]?.category_id || null)

  const level2 = categories.filter(c => c.parent_id === hoveredRoot)
  const level3ByParent = (parentId) => categories.filter(c => c.parent_id === parentId)

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 64,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        zIndex: 199,
        maxHeight: 480,
        overflowY: 'auto',
      }}
      onMouseLeave={onClose}
    >
      <div style={{ maxWidth: 1536, margin: '0 auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 200 }}>

        {/* Column 1: Root categories */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '12px 0' }}>
          {roots.map(cat => (
            <Link key={cat.category_id} href={`/catalog/${cat.slug}`} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                onMouseEnter={() => setHoveredRoot(cat.category_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px',
                  background: hoveredRoot === cat.category_id ? 'var(--accent-soft)' : 'transparent',
                  color: hoveredRoot === cat.category_id ? 'var(--accent)' : 'var(--text)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  borderRadius: 6, margin: '0 4px',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: hoveredRoot === cat.category_id ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.1s',
                }} />
                {cat.NAME}
              </div>
            </Link>
          ))}
        </div>

        {/* Columns 2-4: Subcategories */}
        <div style={{ padding: '20px 24px' }}>
          {level2.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${level2.length <= 5 ? 1 : level2.length <= 10 ? 2 : 3}, 1fr)`, gap: '0 32px' }}>
              {level2.map(sub => {
                const leaves = level3ByParent(sub.category_id)
                return (
                  <div key={sub.category_id} style={{ marginBottom: 20 }}>
                    <Link href={`/catalog/${sub.slug}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                      <div
                        style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, cursor: 'pointer', transition: 'color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)' }}
                      >
                        {sub.NAME}
                      </div>
                    </Link>
                    {leaves.map(leaf => (
                      <Link key={leaf.category_id} href={`/catalog/${leaf.slug}`} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-muted)', padding: '3px 0', cursor: 'pointer', transition: 'color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                        >
                          {leaf.NAME}
                        </div>
                      </Link>
                    ))}
                    {leaves.length === 0 && null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 14 }}>
              Выберите раздел слева
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mobile version: fullscreen drawer with accordion
export function MegaMenuDrawer({ categories, onClose }) {
  const roots = categories.filter(c => !c.parent_id)
  const childrenOf = (id) => categories.filter(c => c.parent_id === id)
  const [openRoot, setOpenRoot] = useState(null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Каталог</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
      </div>

      <Link href="/catalog" onClick={onClose} style={{ display: 'block', padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
        Все товары
      </Link>

      {roots.map(root => {
        const subs = childrenOf(root.category_id)
        const isOpen = openRoot === root.category_id

        return (
          <div key={root.category_id} style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link
                href={`/catalog/${root.slug}`}
                onClick={onClose}
                style={{ flex: 1, padding: '14px 20px', fontSize: 15, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
              >
                {root.NAME}
              </Link>
              {subs.length > 0 && (
                <button
                  onClick={() => setOpenRoot(isOpen ? null : root.category_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '14px 20px', color: 'var(--text-muted)', fontSize: 18 }}
                >
                  {isOpen ? '▲' : '▼'}
                </button>
              )}
            </div>

            {isOpen && subs.length > 0 && (
              <div style={{ background: 'var(--surface)', paddingLeft: 0 }}>
                {subs.map(sub => (
                  <Link
                    key={sub.category_id}
                    href={`/catalog/${sub.slug}`}
                    onClick={onClose}
                    style={{ display: 'block', padding: '11px 20px 11px 36px', fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {sub.NAME}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MegaMenuDesktop
