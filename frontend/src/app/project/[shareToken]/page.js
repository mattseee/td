'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useProjectsStore from '@/store/projectsStore'
import ProjectItemsTable from '@/components/account/ProjectItemsTable'
import { formatPrice } from '@/utils/formatPrice'

const TYPE_LABELS = {
  repair: 'Ремонт',
  construction: 'Строительство',
  dacha: 'Дача',
  commercial: 'Коммерческий',
}

export default function PublicProjectPage() {
  const { shareToken } = useParams()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const getByShareToken = useProjectsStore(s => s.getByShareToken)

  if (!mounted) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ height: 300, background: 'var(--surface)', borderRadius: 8 }} />
      </div>
    )
  }

  const project = getByShareToken(shareToken)

  if (!project) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontWeight: 700, fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
          Проект не найден
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          Ссылка недействительна или проект был удалён.
        </p>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          ← На главную
        </Link>
      </div>
    )
  }

  const totalPlanned = project.items
    .reduce((sum, i) => sum + i.price_fixed * i.quantity_planned, 0)

  const purchasedTotal = project.items
    .filter(i => i.status === 'purchased')
    .reduce((sum, i) => sum + i.price_fixed * (i.quantity_bought || i.quantity_planned), 0)

  const createdDate = new Date(project.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Badge: public view */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(77,158,255,0.15)', border: '1px solid rgba(77,158,255,0.3)',
        borderRadius: 20, padding: '4px 14px', marginBottom: 24,
        fontSize: 12, color: 'var(--info)', fontWeight: 600,
      }}>
        👁 Просмотр · Только чтение
      </div>

      {/* Project header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '28px 32px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          {TYPE_LABELS[project.type] || project.type} · Создан {createdDate}
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 32, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
          Проект: {project.name}
        </h1>

        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Позиций в смете</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
              {project.items.length}
            </div>
          </div>
          {project.budget > 0 && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Бюджет</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {formatPrice(project.budget)}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Итого смета</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
              {formatPrice(totalPlanned)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Куплено</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>
              {formatPrice(purchasedTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Items table (readonly) */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, fontWeight: 600, margin: '0 0 20px', color: 'var(--text)' }}>
          Смета проекта
        </h2>

        {project.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
            В проекте пока нет позиций
          </div>
        ) : (
          <ProjectItemsTable
            projectId={project.id}
            items={project.items}
            readOnly={true}
          />
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        marginTop: 28, textAlign: 'center',
        background: 'var(--surface-2)', borderRadius: 10,
        padding: '20px 24px',
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Хотите создать свою смету?
        </p>
        <Link href="/" style={{
          color: 'var(--accent)', textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
        }}>
          Перейти в ТД Сток →
        </Link>
      </div>
    </div>
  )
}
