'use client'
import { useState } from 'react'
import Link from 'next/link'
import useProjectsStore from '@/store/projectsStore'
import useUiStore from '@/store/uiStore'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatPrice } from '@/utils/formatPrice'

const TYPE_LABELS = {
  repair: 'Ремонт',
  construction: 'Строительство',
  dacha: 'Дача',
  commercial: 'Коммерческий',
}

const TYPE_COLORS = {
  repair: 'var(--accent)',
  construction: 'var(--info)',
  dacha: 'var(--success)',
  commercial: 'var(--exclusive)',
}

export default function ProjectCard({ project }) {
  const deleteProject = useProjectsStore(s => s.deleteProject)
  const addToast = useUiStore(s => s.addToast)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const purchasedTotal = project.items
    .filter(i => i.status === 'purchased')
    .reduce((sum, i) => sum + i.price_fixed * (i.quantity_bought || i.quantity_planned), 0)

  const progressPct = project.budget > 0
    ? Math.min(100, Math.round((purchasedTotal / project.budget) * 100))
    : 0

  const handleDelete = () => {
    deleteProject(project.id)
    addToast('Проект удалён', 'success')
    setConfirmOpen(false)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/project/${project.shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      addToast('Ссылка скопирована!', 'success')
    }).catch(() => {
      addToast(url, 'info', 8000)
    })
  }

  const createdDate = new Date(project.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              {project.name}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              background: `${TYPE_COLORS[project.type]}22`,
              color: TYPE_COLORS[project.type],
              border: `1px solid ${TYPE_COLORS[project.type]}44`,
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {TYPE_LABELS[project.type] || project.type}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Создан {createdDate} · {project.items.length} позиций
          </div>
        </div>
      </div>

      {/* Budget progress */}
      {project.budget > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Потрачено: {formatPrice(purchasedTotal)}</span>
            <span>Бюджет: {formatPrice(project.budget)}</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${progressPct}%`,
              background: progressPct > 90 ? 'var(--danger)' : progressPct > 70 ? 'var(--accent)' : 'var(--success)',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{progressPct}% бюджета</div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href={`/account/projects/${project.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <Button size="sm" fullWidth>Открыть</Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleShare}>🔗 Поделиться</Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>Удалить</Button>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Удалить проект">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Удалить проект «{project.name}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={handleDelete}>Удалить</Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>Отмена</Button>
        </div>
      </Modal>
    </div>
  )
}
