'use client'
import { MASTERS } from '@/data/masters'
import MasterCard from '@/components/masters/MasterCard'

export default function MastersPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Мастера ТД Сток
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
          Реальные профессионалы, которые работают с нашими материалами. Изучайте их проекты, советы и используемые товары.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {MASTERS.map(master => (
          <MasterCard key={master.id} master={master} />
        ))}
      </div>
    </div>
  )
}
