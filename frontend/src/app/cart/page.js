'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import useCartStore from '@/store/cartStore'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import CompletenessCheck from '@/components/cart/CompletenessCheck'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const items = useCartStore(s => s.items)

  if (!mounted) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: 300, background: 'var(--surface)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Корзина
        {items.length > 0 && (
          <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 12 }}>
            {items.reduce((s, i) => s + i.quantity, 0)} товара
          </span>
        )}
      </h1>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }} className="cart-layout">
          {/* Items */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0 24px' }}>
            {items.map(item => (
              <CartItem key={item.product_id} item={item} />
            ))}
          </div>

          {/* Summary + Completeness */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <CartSummary />
            <CompletenessCheck />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) { .cart-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

function EmptyCart() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Корзина пуста
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 24 }}>
        Добавьте товары из каталога
      </p>
      <Link href="/catalog">
        <Button variant="primary" size="lg">В каталог</Button>
      </Link>
    </div>
  )
}
