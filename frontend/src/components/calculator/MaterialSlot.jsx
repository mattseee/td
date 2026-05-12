'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import { getImageUrl } from '@/utils/getImageUrl'
import { formatPrice } from '@/utils/formatPrice'
import useCityStore from '@/store/cityStore'
import Skeleton from '@/components/ui/Skeleton'

export default function MaterialSlot({ material, onSelectProduct }) {
  const city = useCityStore(s => s.city)
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const queryParams = { limit: 5 }
  if (material.searchQuery) queryParams.q = material.searchQuery
  if (material.categoryId) queryParams.category_id = material.categoryId
  if (city) queryParams.city = city

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['calc-material', material.searchQuery, material.categoryId, city],
    queryFn: () => api.get('/api/products', { params: queryParams }).then(r => r.data.data || []),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  })

  const handleSelect = (product) => {
    setSelectedId(product.product_id)
    onSelectProduct(material.name, product)
  }

  const selected = products.find(p => p.product_id === selectedId)

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {/* Строка материала */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{material.name}</div>
          {material.note && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{material.note}</div>
          )}
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700,
          color: 'var(--accent)', whiteSpace: 'nowrap',
        }}>
          {material.quantity} {material.unit}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'transparent', border: '1px solid var(--accent)', borderRadius: 6,
            padding: '6px 14px', fontSize: 12, color: 'var(--accent)', cursor: 'pointer',
            fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          {expanded ? 'Скрыть товары' : 'Подобрать товар'}
        </button>
        {selected && (
          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Выбран</div>
        )}
      </div>

      {/* Список товаров */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          {isLoading && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {[1, 2, 3].map(i => <Skeleton key={i} height={80} width={140} style={{ flexShrink: 0 }} />)}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
              Товары не найдены. Воспользуйтесь поиском в каталоге.
            </div>
          )}

          {!isLoading && products.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
              {products.map(product => {
                const isSelected = selectedId === product.product_id
                return (
                  <label
                    key={product.product_id}
                    style={{
                      flexShrink: 0, width: 160, cursor: 'pointer',
                      background: isSelected ? 'rgba(245,166,35,0.1)' : 'var(--surface)',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s',
                      display: 'block',
                    }}
                  >
                    <input
                      type="radio"
                      name={`material-${material.name}`}
                      value={product.product_id}
                      checked={isSelected}
                      onChange={() => handleSelect(product)}
                      style={{ display: 'none' }}
                    />
                    <img
                      src={getImageUrl(product.main_image)}
                      alt={product.NAME}
                      style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                      onError={e => { e.target.src = '/images/placeholder.jpg' }}
                    />
                    <div style={{ padding: '6px 8px 10px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.NAME}
                      </div>
                      {product.price ? (
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                          {formatPrice(product.price.finalPrice)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>По запросу</div>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
