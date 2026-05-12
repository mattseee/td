'use client'
import ProductCard from '@/components/product/ProductCard'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function ProductGrid({ products, isLoading, viewMode = 'grid' }) {
  if (isLoading) {
    return (
      <div style={gridStyle(viewMode)}>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 16, marginBottom: 8 }}>Товары не найдены</div>
        <div style={{ fontSize: 13 }}>Попробуйте изменить параметры фильтрации</div>
      </div>
    )
  }

  return (
    <div style={gridStyle(viewMode)}>
      {products.map(product => (
        <ProductCard key={product.product_id} product={product} viewMode={viewMode} />
      ))}
    </div>
  )
}

function gridStyle(viewMode) {
  return viewMode === 'list'
    ? { display: 'flex', flexDirection: 'column', gap: 8 }
    : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }
}
