'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useProjectsStore from '@/store/projectsStore'
import useUiStore from '@/store/uiStore'
import ProjectItemsTable from '@/components/account/ProjectItemsTable'
import ProjectBudgetChart from '@/components/account/ProjectBudgetChart'
import ProjectForm from '@/components/account/ProjectForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/utils/formatPrice'

const TYPE_LABELS = {
  repair: 'Ремонт',
  construction: 'Строительство',
  dacha: 'Дача',
  commercial: 'Коммерческий',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [mounted, setMounted] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const project = useProjectsStore(s => s.projects.find(p => p.id === id))
  const updateProject = useProjectsStore(s => s.updateProject)
  const addToast = useUiStore(s => s.addToast)

  const handleShare = () => {
    if (!project) return
    const url = `${window.location.origin}/project/${project.shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      addToast('Ссылка скопирована!', 'success')
    }).catch(() => {
      addToast(url, 'info', 8000)
    })
  }

  const handleEdit = (data) => {
    updateProject(id, data)
    setEditModalOpen(false)
    addToast('Проект обновлён', 'success')
  }

  if (!mounted) {
    return <div style={{ height: 300, background: 'var(--surface)', borderRadius: 8 }} />
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 16px' }}>Проект не найден</h2>
        <Link href="/account/projects">
          <Button variant="ghost">← Мои проекты</Button>
        </Link>
      </div>
    )
  }

  const createdDate = new Date(project.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const purchasedTotal = project.items
    .filter(i => i.status === 'purchased')
    .reduce((sum, i) => sum + i.price_fixed * (i.quantity_bought || i.quantity_planned), 0)

  const totalPlanned = project.items
    .reduce((sum, i) => sum + i.price_fixed * i.quantity_planned, 0)

  return (
    <div>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        <Link href="/account" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Кабинет</Link>
        <span>/</span>
        <Link href="/account/projects" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Проекты</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{project.name}</span>
      </nav>

      {/* Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '24px 28px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            {TYPE_LABELS[project.type] || project.type} · Создан {createdDate}
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 28, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>
            {project.name}
          </h1>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Позиций</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {project.items.length}
              </div>
            </div>
            {project.budget > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Бюджет</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  {formatPrice(project.budget)}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Итого смета</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                {formatPrice(totalPlanned)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Куплено</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                {formatPrice(purchasedTotal)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(true)}>✏️ Редактировать</Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>🔗 Поделиться</Button>
        </div>
      </div>

      {/* Chart + Table */}
      <div style={{
        display: 'grid', gridTemplateColumns: project.items.length > 0 ? '1fr 260px' : '1fr',
        gap: 24, alignItems: 'start', marginBottom: 24,
      }} className="project-layout">
        {/* Items table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>
            Смета
          </h2>
          <ProjectItemsTable projectId={project.id} items={project.items} />
        </div>

        {/* Budget chart */}
        {project.items.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 16, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>
              Расходы
            </h2>
            <ProjectBudgetChart items={project.items} budget={project.budget} />
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Редактировать проект"
        maxWidth={440}
      >
        <ProjectForm
          initialValues={project}
          onSubmit={handleEdit}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>

      <style>{`
        @media (max-width: 767px) { .project-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
