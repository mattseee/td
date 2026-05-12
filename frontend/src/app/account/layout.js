'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import useAuthStore from '@/store/authStore'

const NAV_ITEMS = [
  { href: '/account',           label: 'Дашборд',      icon: '⊞' },
  { href: '/account/orders',    label: 'Заказы',        icon: '📦' },
  { href: '/account/addresses', label: 'Адреса',        icon: '📍' },
  { href: '/account/profile',   label: 'Профиль',       icon: '👤' },
  { href: '/account/favorites', label: 'Избранное',     icon: '♥' },
  { href: '/account/projects',  label: 'Мои проекты',   icon: '🗂', stub: true },
]

function AccountSidebar() {
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase()

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '24px 0', alignSelf: 'flex-start',
      position: 'sticky', top: 24,
    }}>
      {/* Avatar block */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, marginBottom: 10,
        }}>
          {initials}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
          {user?.name || 'Пользователь'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
      </div>

      {/* Navigation */}
      <nav>
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/account'
            ? pathname === '/account'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', textDecoration: 'none',
                color: isActive ? 'var(--accent)' : item.stub ? 'var(--text-muted)' : 'var(--text)',
                background: isActive ? 'var(--accent)11' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.stub && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                  скоро
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 20px 0', marginTop: 12, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, textAlign: 'left',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Выйти
        </button>
      </div>
    </aside>
  )
}

function AccountLayoutContent({ children }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }} className="account-layout">
        <AccountSidebar />
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .account-layout { flex-direction: column !important; }
          .account-layout aside { width: 100% !important; position: static !important; }
        }
      `}</style>
    </div>
  )
}

export default function AccountLayout({ children }) {
  return (
    <ProtectedRoute>
      <AccountLayoutContent>{children}</AccountLayoutContent>
    </ProtectedRoute>
  )
}
