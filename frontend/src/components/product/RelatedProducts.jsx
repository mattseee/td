'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import { formatPrice } from '@/utils/formatPrice'
import useCityStore from '@/store/cityStore'
import useUiStore from '@/store/uiStore'
import useCartStore from '@/store/cartStore'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import ProductCard from '@/components/product/ProductCard'

export default function RelatedProducts({ productId, relationType, title }) {
  const city      = useCityStore(s => s.city)
  const branchIds = useCityStore(s => s.branchIds)
  const [selected, setSelected] = useState({})
  const addToast  = useUiStore(s => s.addToast)
  const addItem   = useCartStore(s => s.addItem)

  const { data: related = [], isLoading } = useQuery({
    queryKey: ['related', productId, relationType, city],
    queryFn: () => api.get(`/api/products/${productId}/related`, {
      params: { type: relationType, city: city || undefined },
    }).then(r => r.data.data),
  })

  if (!isLoading && !related.length) return null

  const selectedCount = Object.values(selected).filter(Boolean).length
  const selectedTotal = related
    .filter(p => selected[p.product_id])
    .reduce((sum, p) => sum + (p.price?.finalPrice || 0), 0)

  const toggleSelect = (id) => setSelected(s => ({ ...s, [id]: !s[id] }))

  const handleAddBundle = () => {
    const selectedProducts = related.filter(p => selected[p.product_id])
    const noPrice = selectedProducts.filter(p => !p.price)
    if (noPrice.length > 0 && !city) {
      addToast('Выберите город для добавления в корзину', 'info')
      return
    }
    let added = 0
    selectedProducts.forEach(p => {
      if (!p.price) return
      addItem({
        product_id:  p.product_id,
        name:        p.NAME,
        sku:         p.sku,
        image:       p.main_image || null,
        price:       p.price.finalPrice,
        branch_id:   branchIds?.[0] || null,
        category_id: p.category_id || null,
      })
      added++
    })
    if (added > 0) {
      addToast(`Добавлено в корзину: ${added} товара`, 'success')
      setSelected({})
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{title}</h3>

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
          {isLoading && [1, 2, 3, 4].map(i => (
            <div key={i} style={{ width: 220, flexShrink: 0 }}>
              <Skeleton height={200} style={{ marginBottom: 8, borderRadius: 12 }} />
              <Skeleton height={12} style={{ marginBottom: 6 }} />
              <Skeleton height={16} />
            </div>
          ))}
          {related.map(product => (
            <div key={product.product_id} style={{ width: 220, flexShrink: 0, position: 'relative' }}>
              {relationType === 'сопутствующий' && (
                <div
                  style={{
                    position: 'absolute', top: 10, left: 10, zIndex: 20,
                    background: 'var(--surface)', borderRadius: 4,
                    padding: 2, lineHeight: 0,
                  }}
                  onClick={e => { e.stopPropagation(); e.preventDefault(); toggleSelect(product.product_id) }}
                >
                  <input
                    type="checkbox"
                    checked={!!selected[product.product_id]}
                    onChange={() => toggleSelect(product.product_id)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer', display: 'block' }}
                  />
                </div>
              )}
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {relationType === 'сопутствующий' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginTop: 12,
          padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Выбрано: <strong style={{ color: 'var(--text)' }}>{selectedCount} товара</strong>
          </span>
          {selectedTotal > 0 && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {formatPrice(selectedTotal)}
            </span>
          )}
          <Button
            size="sm"
            disabled={selectedCount === 0}
            onClick={handleAddBundle}
          >
            Добавить выбранное в корзину
          </Button>
        </div>
      )}
    </div>
  )
}
