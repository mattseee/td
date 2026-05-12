'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import useCartStore from '@/store/cartStore'
import useUiStore from '@/store/uiStore'
import { checkCompatibility, CATEGORY_NAMES, CATEGORY_SLUGS } from '@/data/compatibility'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function CompletenessCheck() {
  const [modalOpen, setModalOpen] = useState(false)
  const [issues, setIssues] = useState([])
  const items = useCartStore(s => s.items)
  const addToast = useUiStore(s => s.addToast)

  const handleCheck = () => {
    const found = checkCompatibility(items)
    if (found.length === 0) {
      addToast('Комплектность в порядке ✓', 'success')
    } else {
      setIssues(found)
      setModalOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleCheck}
        style={{
          width: '100%', background: 'var(--accent-soft)',
          border: '0.5px solid var(--accent)', borderRadius: 8,
          padding: '10px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: 'var(--accent)', fontSize: 13, fontWeight: 600,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)' }}
      >
        <Search size={16} />
        Проверить комплектность
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Возможно, вам не хватает:"
        maxWidth={520}
      >
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Мы обнаружили товары в корзине, к которым обычно требуются сопутствующие материалы:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {issues.map((issue, i) => {
            const missingName = CATEGORY_NAMES[issue.missingCategoryId] || `Категория ${issue.missingCategoryId}`
            const slug = CATEGORY_SLUGS[issue.missingCategoryId]
            return (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--accent-2)', borderRadius: 8,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      • {missingName}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {issue.message}
                    </div>
                  </div>
                  {slug && (
                    <Link href={`/catalog/${slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <Button variant="secondary" size="sm">Найти товар</Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <Button variant="ghost" fullWidth onClick={() => setModalOpen(false)}>
          Понятно, продолжить
        </Button>
      </Modal>
    </>
  )
}
