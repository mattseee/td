'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import useAuthStore from '@/store/authStore'
import useFavoritesStore from '@/store/favoritesStore'
import useProjectsStore from '@/store/projectsStore'
import OrderCard from '@/components/account/OrderCard'
import Skeleton from '@/components/ui/Skeleton'

export default function AccountDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const user = useAuthStore(s => s.user)
  const favoriteCount = useFavoritesStore(s => s.productIds.length)
  const projectCount = useProjectsStore(s => s.projects.length)

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['account-orders-dashboard'],
    queryFn: () => api.get('/api/account/orders?limit=3').then(r => r.data),
  })

  const { data: addressesData } = useQuery({
    queryKey: ['account-addresses-dashboard'],
    queryFn: () => api.get('/api/account/addresses').then(r => r.data),
  })

  const orders = ordersData?.data || []
  const addressCount = addressesData?.data?.length || 0

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase()

  const TILES = [
    { href: '/account/addresses', icon: '📍', label: 'Адреса',       count: addressCount },
    { href: '/account/favorites', icon: '♥',  label: 'Избранное',    count: favoriteCount },
    { href: '/account/projects',  icon: '🗂',  label: 'Мои проекты', count: mounted ? projectCount : 0 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Profile card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            {user?.name || 'Пользователь'}
          </h2>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
          {user?.phone && <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>{user.phone}</div>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link href="/account/profile" style={{
            fontSize: 13, color: 'var(--accent)', textDecoration: 'none',
            border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 14px',
          }}>
            Редактировать
          </Link>
        </div>
      </div>

      {/* Quick tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="tiles-grid">
        {TILES.map(tile => (
          <Link key={tile.href} href={tile.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '20px 16px', textAlign: 'center', transition: 'border-color 0.15s, transform 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{tile.icon}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{tile.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
                {tile.count}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Последние заказы</h3>
          <Link href="/account/orders" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            Все заказы →
          </Link>
        </div>

        {ordersLoading && [1, 2, 3].map(i => (
          <Skeleton key={i} height={70} borderRadius={10} style={{ marginBottom: 10 }} />
        ))}

        {!ordersLoading && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <p style={{ margin: '0 0 12px', fontSize: 14 }}>Заказов пока нет</p>
            <Link href="/catalog" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}>
              Перейти в каталог →
            </Link>
          </div>
        )}

        {!ordersLoading && orders.map(order => (
          <div key={order.order_id} style={{ marginBottom: 10 }}>
            <OrderCard order={order} />
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 600px) { .tiles-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  )
}
