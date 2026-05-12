'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/utils/getImageUrl'
import { formatPrice } from '@/utils/formatPrice'
import RatingStars from '@/components/ui/RatingStars'
import useUiStore from '@/store/uiStore'
import useCartStore from '@/store/cartStore'
import useCityStore from '@/store/cityStore'
import useFavoritesStore from '@/store/favoritesStore'

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  )
}

function HeartIcon({ filled }) {
  return filled
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--danger)" stroke="var(--danger)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}

export default function ProductCard({ product, viewMode = 'grid' }) {
  const addToast  = useUiStore(s => s.addToast)
  const addItem   = useCartStore(s => s.addItem)
  const branchIds = useCityStore(s => s.branchIds)
  const toggle    = useFavoritesStore(s => s.toggle)
  const isFav     = useFavoritesStore(s => s.productIds.includes(product.product_id))
  const [cartHover, setCartHover] = useState(false)

  const isList = viewMode === 'list'

  const hasDiscount = product.price && product.price.priceType !== 'regular' && product.price.originalPrice
  const discountPct = product.price?.discountPercent

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: isList ? 0 : -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: { duration: 0.15 } }}
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: isList ? 'row' : 'column',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
      }}
    >
      {/* Image area */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        width: isList ? 160 : '100%',
        height: isList ? 120 : 200,
        background: 'var(--surface-2)',
        overflow: 'hidden',
      }}>
        <Link href={`/product/${product.product_id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
          <img
            src={getImageUrl(product.main_image)}
            alt={product.NAME}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', padding: 8 }}
            onError={e => { e.target.src = '/images/placeholder.jpg' }}
          />
        </Link>

        {/* Single badge — highest priority wins */}
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          {(() => {
            const s = { fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.6, display: 'inline-block' }
            if (product.price?.priceType === 'promo') {
              const suffix = discountPct > 0 ? ` −${discountPct}%` : ''
              return <span style={{ ...s, background: 'var(--badge-sale-bg)', color: 'var(--badge-sale-text)' }}>Акция{suffix}</span>
            }
            if (product.is_exclusive === 1) {
              return <span style={{ ...s, background: 'var(--badge-exclusive-bg)', color: 'var(--badge-exclusive-text)' }}>Эксклюзив</span>
            }
            if (discountPct > 0) {
              return <span style={{ ...s, background: 'var(--badge-sale-bg)', color: 'var(--badge-sale-text)' }}>−{discountPct}%</span>
            }
            if (product.avg_rating >= 4.5 && product.review_count > 5) {
              return <span style={{ ...s, background: 'var(--badge-hit-bg)', color: 'var(--badge-hit-text)' }}>Хит</span>
            }
            return null
          })()}
        </div>

        {/* Favourite button */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.product_id) }}
          aria-label={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            color: isFav ? 'var(--danger)' : 'var(--text-subtle)',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--danger)'
            e.currentTarget.style.color = 'var(--danger)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = isFav ? 'var(--danger)' : 'var(--text-subtle)'
          }}
        >
          <HeartIcon filled={isFav} />
        </button>
      </div>

      {/* Content area */}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {/* Brand */}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
          {product.brand_name || ' '}
        </div>

        {/* Name */}
        <Link href={`/product/${product.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            fontSize: 14, fontWeight: 500, lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            color: 'var(--text)',
            minHeight: '2.9em',
          }}>
            {product.NAME}
          </div>
        </Link>

        {/* Rating */}
        {product.review_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <RatingStars value={product.avg_rating} size={11} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({product.review_count})</span>
          </div>
        )}

        {/* Price + cart button */}
        <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div>
            {product.price ? (
              <>
                {hasDiscount && (
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', textDecoration: 'line-through', lineHeight: 1.4 }}>
                    {formatPrice(product.price.originalPrice)}
                  </div>
                )}
                <div style={{
                  fontSize: 18, fontWeight: 700,
                  color: hasDiscount ? 'var(--danger)' : 'var(--text)',
                  lineHeight: 1.2,
                }}>
                  {formatPrice(product.price.finalPrice)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Доставка завтра
                </div>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Выберите город</span>
            )}
          </div>

          {/* Cart icon button */}
          <button
            onMouseEnter={() => setCartHover(true)}
            onMouseLeave={() => setCartHover(false)}
            onClick={(e) => {
              e.preventDefault()
              if (!product.price) {
                addToast('Выберите город для добавления в корзину', 'info')
                return
              }
              addItem({
                product_id: product.product_id,
                name:       product.NAME,
                sku:        product.sku,
                image:      product.main_image || null,
                price:      product.price.finalPrice,
                branch_id:  branchIds?.[0] || null,
              })
              addToast(`${product.NAME} добавлен в корзину`, 'success')
            }}
            aria-label="Добавить в корзину"
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: cartHover ? 'var(--accent)' : 'var(--surface-2)',
              border: `1px solid ${cartHover ? 'var(--accent)' : 'var(--border)'}`,
              color: cartHover ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <CartIcon />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
