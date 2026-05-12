'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/utils/formatPrice'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function CartSummary() {
  const router  = useRouter()
  const items   = useCartStore(s => s.items)
  const total   = useCartStore(s => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0))
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addToast = useUiStore(s => s.addToast)

  const [promoCode, setPromoCode] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push('/checkout')
    } else {
      setLoginModalOpen(true)
    }
  }

  const handlePromo = () => {
    addToast('Промокоды появятся скоро', 'info')
  }

  return (
    <>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 24,
        position: 'sticky',
        top: 80,
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
          Итого
        </h3>

        {/* Promo code */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="promo-code" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
            Промокод
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="promo-code"
              type="text"
              placeholder="Введите промокод"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              style={{
                flex: 1, background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
              }}
            />
            <button
              onClick={handlePromo}
              aria-label="Применить промокод"
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '8px 14px', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap',
              }}
            >
              Применить
            </button>
          </div>
        </div>

        {/* Summary lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
            <span>Товары ({items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
            <span style={{  }}>{formatPrice(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
            <span>Доставка</span>
            <span style={{ color: 'var(--success)' }}>Бесплатно</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>Итого</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <Button variant="primary" fullWidth size="lg" onClick={handleCheckout}>
          Оформить заказ
        </Button>
      </div>

      {/* Login required modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Войдите чтобы оформить заказ"
      >
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Для оформления заказа необходимо войти в аккаунт или зарегистрироваться.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/auth/login?redirect=/checkout" onClick={() => setLoginModalOpen(false)}>
            <Button variant="primary" fullWidth size="lg">Войти</Button>
          </Link>
          <Link href="/auth/register?redirect=/checkout" onClick={() => setLoginModalOpen(false)}>
            <Button variant="secondary" fullWidth size="lg">Регистрация</Button>
          </Link>
        </div>
      </Modal>
    </>
  )
}
