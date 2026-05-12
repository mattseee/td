'use client'
import Link from 'next/link'
import OrderStatusBadge from './OrderStatusBadge'
import { formatPrice } from '@/utils/formatPrice'
import { formatDate } from '@/utils/formatDate'

export default function OrderCard({ order }) {
  return (
    <Link href={`/account/orders/${order.order_id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Заказ <span style={{  }}>№{order.order_id}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {formatDate(order.created_at)} · {order.item_count} {pluralItems(order.item_count)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 700,  }}>
            {formatPrice(order.total)}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>
    </Link>
  )
}

function pluralItems(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'товар'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'товара'
  return 'товаров'
}
