'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import useFavoritesStore from '@/store/favoritesStore'
import ProductCard from '@/components/product/ProductCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

export default function FavoritesPage() {
  const productIds = useFavoritesStore(s => s.productIds)
  const clear = useFavoritesStore(s => s.clear)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['favorites-products', productIds.join(',')],
    queryFn: () => api.get(`/api/products?ids=${productIds.join(',')}`).then(r => r.data),
    enabled: productIds.length > 0,
    staleTime: 60 * 1000,
  })

  const products = data?.data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Избранное {productIds.length > 0 && (
            <span style={{ fontSize: 16, color: 'var(--text-muted)',  }}>
              ({productIds.length})
            </span>
          )}
        </h1>
        {productIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            Очистить всё
          </Button>
        )}
      </div>

      {productIds.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)',
          background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>♡</div>
          <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            Список избранного пуст
          </p>
          <p style={{ margin: '0 0 24px', fontSize: 14 }}>
            Нажимайте ♥ на карточках товаров, чтобы добавить их сюда
          </p>
          <Link href="/catalog">
            <Button>Перейти в каталог</Button>
          </Link>
        </div>
      )}

      {productIds.length > 0 && isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {productIds.map(id => <SkeletonCard key={id} />)}
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {products.map(product => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Очистить избранное"
      >
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Удалить все товары из списка избранного?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="danger"
            fullWidth
            onClick={() => { clear(); setConfirmOpen(false) }}
          >
            Удалить
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </div>
  )
}
