'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Package, Truck, Users, FolderTree, Tag } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'

const NAV_ITEMS = [
  { href: '/admin',            label: 'Дашборд',      Icon: BarChart3 },
  { href: '/admin/products',   label: 'Товары',        Icon: Package },
  { href: '/admin/orders',     label: 'Заказы',        Icon: Truck },
  { href: '/admin/users',      label: 'Пользователи',  Icon: Users },
  { href: '/admin/categories', label: 'Категории',     Icon: FolderTree },
  { href: '/admin/promotions', label: 'Акции',         Icon: Tag },
]

function AdminLogo() {
  return (
    <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#EF4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>ТД</span>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.5px', lineHeight: 1.1 }}>ТД СТОК</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>Панель управления</div>
      </div>
    </Link>
  )
}

function SidebarContent({ pathname, onClose }) {
  const { user, logout } = useAuthStore()
  const addToast = useUiStore(s => s.addToast)
  const router   = useRouter()

  function handleLogout() {
    logout()
    addToast('Выход выполнен', 'info')
    router.push('/')
  }

  return (
    <>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <AdminLogo />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Закрыть меню"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}
          >×</button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 0' }} aria-label="Навигация панели управления">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 14, fontWeight: 500,
                color: active ? 'var(--accent)' : 'var(--text)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                borderRight: active ? '3px solid var(--accent)' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <item.Icon size={20} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ← На сайт
        </Link>
        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name || user?.email}
        </div>
        <button
          onClick={handleLogout}
          style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Выйти
        </button>
      </div>
    </>
  )
}

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <div className="theme-admin" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        <aside
          className="admin-sidebar-desktop"
          style={{
            width: 240, flexShrink: 0,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 0, height: '100vh',
            overflowY: 'auto',
          }}
        >
          <SidebarContent pathname={pathname} onClose={null} />
        </aside>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Topbar */}
          <header style={{
            height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 16px',
            position: 'sticky', top: 0, zIndex: 10,
            gap: 12,
          }}>
            {/* Mobile hamburger */}
            <button
              className="admin-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label="Открыть меню панели управления"
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 10px', color: 'var(--text)',
                cursor: 'pointer', fontSize: 18, display: 'none',
              }}
            >☰</button>

            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
              {breadcrumb}
            </div>
            {pathname === '/admin/products' && (
              <Link
                href="/admin/products/new"
                style={{
                  background: 'var(--accent)', color: '#fff',
                  padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                + Новый товар
              </Link>
            )}
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex' }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Навигация"
            onClick={e => e.stopPropagation()}
            style={{
              width: 260, background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              height: '100vh', overflowY: 'auto',
              boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
            }}
          >
            <SidebarContent pathname={pathname} onClose={() => setDrawerOpen(false)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-menu-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function getBreadcrumb(pathname) {
  const map = {
    '/admin': 'Дашборд',
    '/admin/products': 'Товары',
    '/admin/products/new': 'Товары / Новый товар',
    '/admin/orders': 'Заказы',
    '/admin/users': 'Пользователи',
    '/admin/categories': 'Категории',
    '/admin/promotions': 'Акции',
  }
  if (map[pathname]) return map[pathname]
  if (pathname.includes('/admin/products/') && pathname.includes('/edit')) return 'Товары / Редактирование'
  if (pathname.startsWith('/admin/orders/')) return 'Заказы / Детали заказа'
  if (pathname.startsWith('/admin/promotions/')) return 'Акции / Детали акции'
  return 'Панель управления'
}
