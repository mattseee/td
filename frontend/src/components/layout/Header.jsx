'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import { useDebounce } from '@/hooks/useDebounce'
import CitySelector from './CitySelector'
import { MegaMenuDesktop, MegaMenuDrawer } from './MegaMenu'
import { getImageUrl } from '@/utils/getImageUrl'
import useAuthStore from '@/store/authStore'
import useCartStore from '@/store/cartStore'
import Logo from '@/components/ui/Logo'

export default function Header() {
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuthStore()
  const cartItems = useCartStore(s => s.items)
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchRef = useRef(null)
  const menuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const { data: searchResults } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => api.get('/api/search', { params: { q: debouncedSearch, limit: 6 } }).then(r => r.data.data),
    enabled: debouncedSearch.length >= 2,
  })

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleKeydown = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [])

  const showDropdown = searchFocused && debouncedSearch.length >= 2 && searchResults
  const hasResults = showDropdown && (
    searchResults.products?.length > 0 ||
    searchResults.categories?.length > 0 ||
    searchResults.brands?.length > 0
  )

  return (
    <>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 200,
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
        transition: 'box-shadow 0.2s',
      }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', padding: '0 16px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Mobile hamburger */}
          <button
            className="mobile-only"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Открыть каталог"
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '6px 10px', color: 'var(--text)', cursor: 'pointer', fontSize: 18, flexShrink: 0,
            }}
          >
            ☰
          </button>

          {/* Logo */}
          <Logo href="/" />

          {/* Catalog button (desktop) */}
          <div ref={menuRef} style={{ flexShrink: 0 }} className="desktop-only">
            <button
              onMouseEnter={() => setMenuOpen(true)}
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: menuOpen ? 'var(--accent-soft)' : 'none',
                border: `1px solid ${menuOpen ? 'var(--accent)' : 'var(--border)'}`,
                color: menuOpen ? 'var(--accent)' : 'var(--text)',
                padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect y="1" width="14" height="2" rx="1"/>
                <rect y="6" width="14" height="2" rx="1"/>
                <rect y="11" width="14" height="2" rx="1"/>
              </svg>
              Каталог
            </button>
          </div>

          {/* Quick nav links (desktop) */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} className="desktop-only">
            <Link href="/calculator" style={{
              fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
              padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Калькулятор
            </Link>
            <Link href="/masters" style={{
              fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
              padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Мастера
            </Link>
          </div>

          {/* Search (desktop) */}
          <div ref={searchRef} style={{ flex: 1, minWidth: 0, maxWidth: 672, position: 'relative' }} className="desktop-only">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: 12, color: 'var(--text-subtle)', pointerEvents: 'none', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <label htmlFor="site-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Поиск по сайту
              </label>
              <input
                id="site-search"
                type="search"
                placeholder="Поиск товаров, брендов, категорий..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                autoComplete="off"
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '9px 12px 9px 40px',
                  color: 'var(--text)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s',
                  boxShadow: searchFocused ? '0 0 0 3px var(--accent-soft)' : 'none',
                }}
              />
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                maxHeight: 400, overflowY: 'auto',
              }}>
                {!hasResults && (
                  <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 14 }}>Ничего не найдено</div>
                )}
                {searchResults.products?.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 1 }}>Товары</div>
                    {searchResults.products.map(p => (
                      <Link key={p.product_id} href={`/product/${p.product_id}`}
                        onClick={() => { setSearchFocused(false); setSearchQuery('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', textDecoration: 'none', color: 'var(--text)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {p.main_image && (
                          <img src={getImageUrl(p.main_image)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: '1px solid var(--border)' }} />
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.NAME}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand_name} · {p.sku}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.categories?.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 1 }}>Категории</div>
                    {searchResults.categories.map(c => (
                      <Link key={c.category_id} href={`/catalog/${c.slug}`}
                        onClick={() => { setSearchFocused(false); setSearchQuery('') }}
                        style={{ display: 'block', padding: '8px 16px', textDecoration: 'none', color: 'var(--text)', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >{c.NAME}</Link>
                    ))}
                  </div>
                )}
                {searchResults.brands?.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: 1 }}>Бренды</div>
                    {searchResults.brands.map(b => (
                      <div key={b.brand_id} style={{ padding: '8px 16px', color: 'var(--text)', fontSize: 13 }}>{b.NAME}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            className="mobile-only"
            onClick={() => setMobileSearchOpen(v => !v)}
            aria-label="Поиск"
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '7px 10px', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Spacer for mobile */}
          <div style={{ flex: 1 }} className="mobile-only" />

          {/* City selector */}
          <CitySelector />

          {/* Auth buttons / user menu (desktop) */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, position: 'relative' }} className="desktop-only" ref={userMenuRef}>
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login">
                  <button style={{
                    background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    padding: '7px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  }}>
                    Войти
                  </button>
                </Link>
                <Link href="/auth/register">
                  <button style={{
                    background: 'var(--accent)', border: 'none', borderRadius: 6,
                    padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>
                    Регистрация
                  </button>
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: userMenuOpen ? 'var(--surface-2)' : 'none',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '6px 12px', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(user?.name || user?.email || '?')[0].toUpperCase()}
                  </span>
                  <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || user?.email}
                  </span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                    <path d="M1 1l4 4 4-4"/>
                  </svg>
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 300,
                    overflow: 'hidden',
                  }}>
                    {[
                      { label: 'Личный кабинет', href: '/account' },
                      { label: 'Мои заказы', href: '/account/orders' },
                      ...(user?.role === 'admin' ? [{ label: 'Админ-панель', href: '/admin', accent: true }] : []),
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'block', padding: '10px 16px', fontSize: 13,
                          color: item.accent ? 'var(--accent)' : 'var(--text)', textDecoration: 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 16px', fontSize: 13, color: 'var(--danger)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cart icon with badge */}
          <Link href="/cart" style={{ position: 'relative', textDecoration: 'none', flexShrink: 0 }}>
            <button style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '7px 10px', color: 'var(--text)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--brand-red)', color: '#fff',
                borderRadius: '50%', minWidth: 18, height: 18,
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile search bar (expandable) */}
        {mobileSearchOpen && (
          <div className="mobile-only" style={{ padding: '8px 16px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg style={{ position: 'absolute', left: 12, color: 'var(--text-subtle)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--accent)', borderRadius: 8,
                  padding: '9px 12px 9px 40px', color: 'var(--text)', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Desktop MegaMenu (full-width, fixed) */}
      {menuOpen && (
        <MegaMenuDesktop categories={categories} onClose={() => setMenuOpen(false)} />
      )}

      {/* Mobile MegaMenu drawer */}
      {mobileMenuOpen && (
        <MegaMenuDrawer categories={categories} onClose={() => setMobileMenuOpen(false)} />
      )}

      {/* Backdrop overlay behind desktop mega menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 98,
          }}
        />
      )}

      <style>{`
        .desktop-only { display: flex; }
        .mobile-only  { display: none; }
        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
