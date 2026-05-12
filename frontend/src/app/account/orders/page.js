'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import OrderCard from '@/components/account/OrderCard'
import Skeleton from '@/components/ui/Skeleton'

const STATUS_TABS = [
  { value: '',           label: 'Все' },
  { value: 'pending',    label: 'Ожидает' },
  { value: 'processing', label: 'В работе' },
  { value: 'completed',  label: 'Выполнен' },
  { value: 'cancelled',  label: 'Отменён' },
]

export default function OrdersPage() {
  const [activeStatus, setActiveStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['account-orders'],
    queryFn: () => api.get('/api/account/orders?limit=50').then(r => r.data),
  })

  const allOrders = data?.data || []
  const orders = activeStatus
    ? allOrders.filter(o => o.status === activeStatus)
    : allOrders

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 24px', color: 'var(--text)' }}>
        Мои заказы
      </h1>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: `1px solid ${activeStatus === tab.value ? 'var(--accent)' : 'var(--border)'}`,
              background: activeStatus === tab.value ? 'var(--accent)22' : 'transparent',
              color: activeStatus === tab.value ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {tab.value === '' && allOrders.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({allOrders.length})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && [1, 2, 3].map(i => (
        <Skeleton key={i} height={74} borderRadius={10} style={{ marginBottom: 10 }} />
      ))}

      {!isLoading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ margin: '0 0 16px', fontSize: 16 }}>
            {activeStatus ? 'Заказов с таким статусом нет' : 'У вас пока нет заказов'}
          </p>
          <Link href="/catalog" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>
            Перейти в каталог →
          </Link>
        </div>
      )}

      {!isLoading && orders.map(order => (
        <div key={order.order_id} style={{ marginBottom: 10 }}>
          <OrderCard order={order} />
        </div>
      ))}
    </div>
  )
}
