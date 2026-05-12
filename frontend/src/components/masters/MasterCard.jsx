'use client'
import Link from 'next/link'
import { getImageUrl } from '@/utils/getImageUrl'
import Button from '@/components/ui/Button'

const SPECIALTY_ICONS = {
  'Кровельщик': '🏠',
  'Штукатур-отделочник': '🪣',
  'Монтажник климатической техники': '❄️',
  'Монтажник гипсокартона': '🔧',
  'Паркетчик и укладчик ламината': '▪️',
}

export default function MasterCard({ master, compact = false }) {
  const icon = SPECIALTY_ICONS[master.specialty] || '👷'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: compact ? 160 : 200, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <img
          src={master.photo || '/images/masters/placeholder_master.jpg'}
          alt={master.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = '/images/masters/placeholder_master.jpg' }}
        />
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(15,17,23,0.8)', backdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--accent)',
        }}>
          ★ {master.rating}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: compact ? '12px 16px' : '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: compact ? 16 : 18 }}>{icon}</span>
          <h3 style={{
            fontSize: compact ? 16 : 18,
            fontWeight: 700, margin: 0, color: 'var(--text)',
          }}>
            {master.name}
          </h3>
        </div>

        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
          {master.specialty}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: compact ? 12 : 16 }}>
          📍 {master.city} · Опыт {master.experience} лет · {master.completedProjects} проектов
        </div>

        {!compact && master.project && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {master.project.description}
          </p>
        )}

        <Link href={`/masters/${master.id}`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm" fullWidth>Подробнее</Button>
        </Link>
      </div>
    </div>
  )
}
