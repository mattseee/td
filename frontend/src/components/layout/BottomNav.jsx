'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useCartStore from '@/store/cartStore'

const NAV_ITEMS = [
  { href: '/',        label: 'Главная', icon: '🏠' },
  { href: '/catalog', label: 'Каталог', icon: '📦' },
  { href: '/search',  label: 'Поиск',   icon: '🔍' },
  { href: '/cart',    label: 'Корзина', icon: '🛒', badge: true },
  { href: '/account', label: 'Аккаунт', icon: '👤' },
]

export default function BottomNav() {
  const pathname   = usePathname()
  const cartItems  = useCartStore(s => s.items)
  const cartCount  = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      display: 'flex',
    }}
      className="bottom-nav"
    >
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '8px 4px', gap: 2,
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none', minHeight: 56, fontSize: 18, position: 'relative',
          }}>
            <span style={{ position: 'relative' }}>
              {item.icon}
              {item.badge && cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  background: 'var(--brand-red)', color: '#fff',
                  borderRadius: '50%', minWidth: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 2px',
                }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
