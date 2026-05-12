'use client'
import { formatPrice } from '@/utils/formatPrice'
import Badge from '@/components/ui/Badge'
import useCityStore from '@/store/cityStore'
import { useState, useEffect } from 'react'

export default function PriceBlock({ price, size = 'md' }) {
  const city = useCityStore(s => s.city)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div style={{ height: 32 }} />

  if (!city) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Выберите город для отображения цены
      </div>
    )
  }

  if (!price) {
    return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Цена по запросу</div>
  }

  const mainSize = size === 'lg' ? 28 : size === 'sm' ? 16 : 20
  const oldSize = size === 'lg' ? 16 : 13

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {price.priceType !== 'regular' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: oldSize, color: 'var(--text-muted)',
            textDecoration: 'line-through',
          }}>
            {formatPrice(price.originalPrice)}
          </span>
          <Badge variant={price.priceType === 'promo' ? 'promo' : 'discount'}>
            −{price.discountPercent}%
          </Badge>
          {price.priceType === 'promo' && price.promoName && (
            <Badge variant="promo" style={{ fontSize: 10 }}>{price.promoName}</Badge>
          )}
        </div>
      )}
      <span style={{
        fontSize: mainSize, fontWeight: 700,
        color: price.priceType !== 'regular' ? 'var(--danger)' : 'var(--text)',
      }}>
        {formatPrice(price.finalPrice)}
      </span>
    </div>
  )
}
