'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/utils/formatPrice'
import Button from '@/components/ui/Button'

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>}>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const params  = useSearchParams()
  const orderId = params.get('id')
  const total   = params.get('total')

  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      {/* Success icon */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'rgba(46,204,138,0.12)',
        border: '2px solid var(--success)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 42, margin: '0 auto 28px',
      }}>
        ✓
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
        Заказ оформлен!
      </h1>

      {orderId && (
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 8 }}>
          Заказ <span style={{ color: 'var(--accent)', fontWeight: 700,  }}>
            №{orderId}
          </span> принят в обработку
        </p>
      )}

      {total && (
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          {formatPrice(parseFloat(total))}
        </p>
      )}

      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 36, lineHeight: 1.6 }}>
        Менеджер свяжется с вами для подтверждения деталей доставки.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link href="/account/orders">
          <Button variant="primary" size="lg" fullWidth>
            Перейти в мои заказы
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="lg" fullWidth>
            Продолжить покупки
          </Button>
        </Link>
      </div>
    </div>
  )
}
