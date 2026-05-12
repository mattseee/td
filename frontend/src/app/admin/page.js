'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Calendar, ShoppingCart, DollarSign, UserPlus } from 'lucide-react'
import api from '@/utils/api'
import StatsCard from '@/components/admin/StatsCard'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import { formatPrice } from '@/utils/formatPrice'
import { formatDate } from '@/utils/formatDate'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => { if (r.data.success) setStats(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={90} borderRadius={12} />)}
        </div>
        <Skeleton height={300} borderRadius={12} />
      </div>
    )
  }

  if (!stats) {
    return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Нет данных</div>
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
        Дашборд
      </h1>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatsCard title="Всего товаров" value={stats.totalProducts} Icon={Package} color="var(--info)" />
        <StatsCard title="Заказов сегодня" value={stats.ordersToday} Icon={Calendar} color="var(--accent)" />
        <StatsCard title="Заказов за месяц" value={stats.ordersMonth} Icon={ShoppingCart} color="var(--success)" />
        <StatsCard title="Выручка за месяц" value={formatPrice(stats.revenueMonth)} Icon={DollarSign} color="var(--success)" />
        <StatsCard title="Новых пользователей" value={stats.newUsersMonth} Icon={UserPlus} color="var(--exclusive)" />
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 16, fontWeight: 700 }}>
          Последние заказы
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['№ Заказа', 'Пользователь', 'Сумма', 'Статус', 'Дата'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats.recentOrders || []).map(order => (
                <tr
                  key={order.order_id}
                  onClick={() => router.push(`/admin/orders/${order.order_id}`)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent)' }}>#{order.order_id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)' }}>{order.email}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)',  }}>{formatPrice(order.total)}</td>
                  <td style={{ padding: '12px 16px' }}><OrderStatusBadge status={order.status} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatDate(order.created_at)}</td>
                </tr>
              ))}
              {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Нет заказов</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
