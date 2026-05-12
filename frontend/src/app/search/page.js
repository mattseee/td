'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import { useDebounce } from '@/hooks/useDebounce'
import { getImageUrl } from '@/utils/getImageUrl'
import { formatPrice } from '@/utils/formatPrice'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Skeleton from '@/components/ui/Skeleton'
import ProductCard from '@/components/product/ProductCard'
import useCityStore from '@/store/cityStore'

function SearchContent() {
  const searchParams = useSearchParams()
  const city = useCityStore(s => s.city)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['search-page', debouncedQuery, city],
    queryFn: () => api.get('/api/products', {
      params: { q: debouncedQuery, limit: 24, city: city || undefined },
    }).then(r => r.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  })

  const products = data?.data || []
  const total = data?.total || 0

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 16px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
        Поиск товаров
      </h1>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <label htmlFor="search-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Поиск
        </label>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          id="search-input"
          type="search"
          autoFocus
          placeholder="Введите название товара, артикул или бренд..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', background: 'var(--surface)',
            border: '1px solid var(--accent)',
            borderRadius: 8, padding: '14px 16px 14px 44px',
            color: 'var(--text)', fontSize: 16, outline: 'none',
          }}
        />
      </div>

      {query.length > 0 && query.length < 2 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Введите минимум 2 символа для поиска</p>
      )}

      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && products.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          color: 'var(--text-muted)', background: 'var(--surface)',
          borderRadius: 12, border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            По запросу «{debouncedQuery}» ничего не найдено
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 14 }}>
            Попробуйте изменить запрос или перейдите в каталог
          </p>
          <Link href="/catalog" style={{
            display: 'inline-block', background: 'var(--accent)', color: '#fff',
            padding: '10px 24px', borderRadius: 6, fontWeight: 600, textDecoration: 'none', fontSize: 14,
          }}>
            В каталог
          </Link>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Найдено: {total} товаров
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {products.map(p => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </>
      )}

      {!query && (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ fontSize: 16 }}>Начните вводить запрос для поиска товаров</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 16px 80px' }}>
        <Skeleton height={36} width={200} style={{ marginBottom: 20 }} />
        <Skeleton height={52} style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
