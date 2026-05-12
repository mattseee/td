'use client'
import { useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import useCityStore from '@/store/cityStore'
import FilterSidebar from '@/components/catalog/FilterSidebar'
import SortBar from '@/components/catalog/SortBar'
import ActiveFilters from '@/components/catalog/ActiveFilters'
import ProductGrid from '@/components/catalog/ProductGrid'
import Pagination from '@/components/ui/Pagination'
import Button from '@/components/ui/Button'
import Skeleton, { SkeletonCard } from '@/components/ui/Skeleton'

function CatalogContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const city = useCityStore(s => s.city)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const slugArr = params?.slug || []
  const currentSlug = slugArr[slugArr.length - 1] || null

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/api/brands').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  // Resolve slug → category_id
  const currentCategory = currentSlug ? categories.find(c => c.slug === currentSlug) : null

  // Build filters from URL
  const getFilters = useCallback(() => {
    const f = {}
    for (const [k, v] of searchParams.entries()) f[k] = v
    if (currentCategory && !f.category_id) f.category_id = currentCategory.category_id
    return f
  }, [searchParams, currentCategory])

  const filters = getFilters()
  const [view, setView] = useState('grid')

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v != null && v !== '' && k !== 'category_id') params.set(k, v)
    })
    const catId = newFilters.category_id
    if (catId) {
      const cat = categories.find(c => c.category_id === parseInt(catId))
      if (cat) {
        router.push(`/catalog/${cat.slug}?${params.toString()}`)
        return
      }
    }
    router.push(`/catalog${params.toString() ? '?' + params.toString() : ''}`)
  }

  const removeFilter = (keyOrKeys) => {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
    const next = { ...filters }
    keys.forEach(k => delete next[k])
    if (keys.includes('category_id')) {
      router.push('/catalog')
      return
    }
    updateFilters(next)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters, city],
    queryFn: () => api.get('/api/products', {
      params: {
        ...filters,
        city: city || undefined,
        limit: 12,
      },
    }).then(r => r.data),
    staleTime: 60 * 1000,
  })

  const products = data?.data || []
  const total = data?.total || 0

  // Breadcrumbs
  const breadcrumbs = []
  if (currentCategory) {
    let cat = currentCategory
    const crumbs = []
    while (cat) {
      crumbs.unshift(cat)
      cat = categories.find(c => c.category_id === cat.parent_id)
    }
    breadcrumbs.push(...crumbs)
  }

  return (
    <div style={{ maxWidth: 1536, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Главная</Link>
        <span>/</span>
        <Link href="/catalog" style={{ color: breadcrumbs.length ? 'var(--text-muted)' : 'var(--text)', textDecoration: 'none' }}>Каталог</Link>
        {breadcrumbs.map((c, i) => (
          <span key={c.category_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>/</span>
            <Link href={`/catalog/${c.slug}`} style={{ color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)', textDecoration: 'none' }}>{c.NAME}</Link>
          </span>
        ))}
      </nav>

      <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.01em' }}>
        {currentCategory?.NAME || 'Каталог товаров'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }} className="catalog-grid">

        {/* Sidebar desktop */}
        <aside className="catalog-sidebar" style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 96px)', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 16px' }}>
            <FilterSidebar
              filters={filters}
              categories={categories}
              brands={brands}
              onFilterChange={updateFilters}
              currentCategoryId={currentCategory?.category_id}
            />
          </div>
        </aside>

        {/* Main content */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button variant="ghost" size="sm" onClick={() => setFilterDrawerOpen(true)} className="mobile-filter-btn" style={{ display: 'none' }}>
              ⚙ Фильтры
            </Button>
          </div>

          <ActiveFilters
            filters={filters}
            categories={categories}
            brands={brands}
            onRemove={removeFilter}
            onClearAll={() => updateFilters({})}
          />

          <SortBar
            sort={filters.sort || 'newest'}
            view={view}
            total={total}
            onSortChange={s => updateFilters({ ...filters, sort: s, page: undefined })}
            onViewChange={setView}
          />

          <ProductGrid
            products={products}
            isLoading={isLoading}
            viewMode={view}
          />

          {total > 12 && (
            <div style={{ marginTop: 32 }}>
              <Pagination
                page={parseInt(filters.page) || 1}
                total={total}
                limit={12}
                onChange={p => updateFilters({ ...filters, page: p })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} onClick={() => setFilterDrawerOpen(false)} />
          <div style={{ background: 'var(--surface)', padding: '16px 20px 80px', maxHeight: '80vh', overflowY: 'auto', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Фильтры</span>
              <button onClick={() => setFilterDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <FilterSidebar
              filters={filters}
              categories={categories}
              brands={brands}
              onFilterChange={(f) => { updateFilters(f); setFilterDrawerOpen(false) }}
              currentCategoryId={currentCategory?.category_id}
            />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .catalog-grid { grid-template-columns: 1fr !important; }
          .catalog-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function CatalogSkeleton() {
  return (
    <div style={{ maxWidth: 1536, margin: '0 auto', padding: '24px 24px 80px' }}>
      <Skeleton height={18} width={240} style={{ marginBottom: 16 }} />
      <Skeleton height={36} width={280} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={32} borderRadius={6} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  )
}
