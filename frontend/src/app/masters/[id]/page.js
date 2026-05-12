'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MASTERS } from '@/data/masters'
import BeforeAfterSlider from '@/components/masters/BeforeAfterSlider'
import ProductCard from '@/components/product/ProductCard'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import api from '@/utils/api'

const SPECIALTY_ICONS = {
  'Кровельщик': '🏠',
  'Штукатур-отделочник': '🪣',
  'Монтажник климатической техники': '❄️',
  'Монтажник гипсокартона': '🔧',
  'Паркетчик и укладчик ламината': '▪️',
}

export default function MasterDetailPage() {
  const { id } = useParams()
  const master = MASTERS.find(m => m.id === id)

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['master-products', id],
    queryFn: async () => {
      if (!master?.usedProducts?.length) return []
      const results = await Promise.all(
        master.usedProducts.map(pid =>
          api.get(`/api/products/${pid}`).then(r => r.data.data).catch(() => null)
        )
      )
      return results.filter(Boolean)
    },
    enabled: !!master,
    staleTime: 10 * 60 * 1000,
  })

  if (!master) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>Мастер не найден</h2>
        <Link href="/masters"><Button>← Все мастера</Button></Link>
      </div>
    )
  }

  const products = productsData || []
  const icon = SPECIALTY_ICONS[master.specialty] || '👷'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Главная</Link>
        <span>/</span>
        <Link href="/masters" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Мастера</Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{master.name}</span>
      </nav>

      {/* Hero */}
      <div style={{
        display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40, marginBottom: 48,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '32px', overflow: 'hidden',
      }} className="master-hero">
        {/* Photo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 200, height: 200, borderRadius: '50%',
            overflow: 'hidden', margin: '0 auto 16px',
            border: '3px solid var(--accent)',
          }}>
            <img
              src={master.photo || '/images/masters/placeholder_master.jpg'}
              alt={master.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.src = '/images/masters/placeholder_master.jpg' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                {master.rating}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Рейтинг</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                {master.experience}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Лет опыта</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                {master.completedProjects}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Проектов</div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            {icon} {master.specialty}
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 36, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
            {master.name}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>📍 {master.city}</div>

          <div style={{
            background: 'var(--surface-2)', borderRadius: 8,
            padding: '20px 24px', marginBottom: 24,
          }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>
              {master.project.title}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
              {master.project.description}
            </p>
          </div>
        </div>
      </div>

      {/* Before/After */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          До и после
        </h2>
        <BeforeAfterSlider
          before={master.project.before}
          after={master.project.after}
          height={380}
        />
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          Перетащите ползунок для сравнения
        </p>
      </section>

      {/* Tips */}
      {master.tips?.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            Советы от мастера
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {master.tips.map((tip, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderLeft: '4px solid var(--accent)', borderRadius: 8,
                padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Used products */}
      {master.usedProducts?.length > 0 && (
        <section>
          <h2 style={{ fontWeight: 700, fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
            Используемые материалы
          </h2>
          {productsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {master.usedProducts.map(i => <Skeleton key={i} height={280} borderRadius={10} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {products.map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
          {!productsLoading && products.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>
              Товары временно недоступны
            </div>
          )}
        </section>
      )}

      <style>{`
        @media (max-width: 767px) { .master-hero { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
