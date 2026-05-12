'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Home, Wind, LayoutGrid, Layers, Package as PkgIcon } from 'lucide-react'
import api from '@/utils/api'
import { formatPrice } from '@/utils/formatPrice'
import ProductCard from '@/components/product/ProductCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Skeleton from '@/components/ui/Skeleton'
import useCityStore from '@/store/cityStore'
import { MASTER_OF_THE_WEEK } from '@/data/masters'
import { CALCULATORS } from '@/data/calculator'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

function FadeInSection({ children, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

const CAT_ICONS = { roofing: Home, climate: Wind, walls: LayoutGrid, floors: Layers, default: PkgIcon }

function HeroSlider({ promotions }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (!promotions?.length) return
    const timer = setInterval(() => setIdx(i => (i + 1) % promotions.length), 5000)
    return () => clearInterval(timer)
  }, [promotions?.length])

  if (!promotions?.length) {
    return (
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
        display: 'flex', alignItems: 'stretch', minHeight: 240,
      }}>
        <div style={{ flex: '0 0 60%', padding: '32px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }} className="hero-text-col">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
            Строительный маркетплейс
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
            ТД Сток —<br />
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>стройматериалы профессионалам</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5 }}>
            Более 15 000 товаров с доставкой по Санкт-Петербургу
          </p>
          <div>
            <Link href="/catalog">
              <button style={{
                background: '#fff', border: 'none', borderRadius: 8,
                padding: '11px 28px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', color: 'var(--accent)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Открыть каталог →
              </button>
            </Link>
          </div>
        </div>
        <div style={{ flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px', opacity: 0.9 }} className="hero-svg-col">
          <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* House */}
            <path d="M80 100 L120 60 L160 100 L160 150 L80 150 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            <rect x="100" y="115" width="20" height="35" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            <rect x="130" y="115" width="18" height="18" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
            {/* Ruler */}
            <rect x="30" y="130" width="80" height="14" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <line x1="42" y1="130" x2="42" y2="137" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <line x1="54" y1="130" x2="54" y2="137" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <line x1="66" y1="130" x2="66" y2="137" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <line x1="78" y1="130" x2="78" y2="137" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            <line x1="90" y1="130" x2="90" y2="137" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
            {/* Wrench */}
            <circle cx="195" cy="55" r="18" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
            <circle cx="195" cy="55" r="8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <line x1="195" y1="73" x2="195" y2="100" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round"/>
            {/* Bricks */}
            <rect x="168" y="110" width="52" height="14" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <rect x="168" y="128" width="24" height="14" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <rect x="196" y="128" width="24" height="14" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            {/* Gear */}
            <circle cx="45" cy="62" r="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="6 4"/>
            <circle cx="45" cy="62" r="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          </svg>
        </div>
        <style>{`
          @media (max-width: 767px) {
            .hero-svg-col { display: none !important; }
            .hero-text-col { flex: 1 1 100% !important; padding: 28px 24px !important; }
          }
        `}</style>
      </div>
    )
  }

  const promo = promotions[idx]
  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
            minHeight: 240, padding: '32px 48px',
            display: 'flex', alignItems: 'center',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: 480, position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 11, fontWeight: 600,
              padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 14, backdropFilter: 'blur(4px)',
            }}>
              Акция
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 10, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {promo.NAME}
            </h2>
            {promo.description && (
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 24, lineHeight: 1.6 }}>
                {promo.description}
              </p>
            )}
            <Link href="/catalog">
              <button style={{
                background: '#fff', border: 'none', borderRadius: 8,
                padding: '11px 28px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', color: 'var(--accent)',
              }}>
                Смотреть товары →
              </button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {promotions.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
          {promotions.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

function CalculatorPreview() {
  const calcs = Object.values(CALCULATORS)
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
        borderRadius: 16, padding: '36px 40px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              Инструмент
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#fff' }}>
              Калькулятор материалов
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.6, maxWidth: 400 }}>
              Точный расчёт по нормативам — плитка, штукатурка, кровля, стяжка, покраска
            </p>
          </div>
          <Link href="/calculator" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#fff', border: 'none', borderRadius: 8,
              padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: 'var(--accent)',
            }}>
              Открыть калькулятор →
            </button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
          {calcs.map(calc => (
            <Link key={calc.id} href="/calculator" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '16px 12px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.15s', backdropFilter: 'blur(4px)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
              >
                <div style={{ fontSize: 26, marginBottom: 6 }}>{calc.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{calc.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function MasterOfTheWeekBlock() {
  const master = MASTER_OF_THE_WEEK
  if (!master) return null

  const initials = master.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Мастер недели</h2>
        <Link href="/masters" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
          Все мастера →
        </Link>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '280px 1fr',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }} className="master-week-grid">
        {/* Photo / placeholder */}
        <div style={{ position: 'relative', background: 'var(--surface-2)', minHeight: 280 }}>
          {master.photo ? (
            <img
              src={master.photo}
              alt={master.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 280 }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 280,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-2) 100%)',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff',
              }}>
                {initials}
              </div>
            </div>
          )}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'var(--accent)', color: '#fff',
            fontSize: 11, fontWeight: 600, padding: '4px 12px',
            borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Мастер недели
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
              {master.specialty} · 📍 {master.city}
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', color: 'var(--text)' }}>
              {master.name}
            </h3>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              {[
                { value: `★ ${master.rating}`, label: 'Рейтинг' },
                { value: master.experience, label: 'Лет опыта' },
                { value: master.completedProjects, label: 'Проектов' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {master.project && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, border: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Проект недели</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {master.project.title}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {master.project.description}
                </p>
              </div>
            )}
          </div>

          <Link href={`/masters/${master.id}`} style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
            <button style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              padding: '12px 28px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', color: '#fff', transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              Смотреть проект →
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) { .master-week-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}

const ALPHABET_RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')
const ALPHABET_EN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function BrandsBlock({ popularBrands, allBrands }) {
  const [activeLetter, setActiveLetter] = useState(null)

  const letterMap = {}
  allBrands.forEach(b => {
    const first = (b.NAME || '').trim()[0]?.toUpperCase()
    if (first) {
      if (!letterMap[first]) letterMap[first] = []
      letterMap[first].push(b)
    }
  })

  const availableLetters = new Set(Object.keys(letterMap))
  const allLetters = [...ALPHABET_RU, ...ALPHABET_EN]

  const displayBrands = activeLetter ? (letterMap[activeLetter] || []) : popularBrands

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Бренды</h2>
        <Link href="/catalog" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
          Все бренды →
        </Link>
      </div>

      {/* Letter filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          onClick={() => setActiveLetter(null)}
          style={{
            width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeLetter === null ? 'var(--accent)' : 'var(--surface-2)',
            color: activeLetter === null ? '#fff' : 'var(--text-muted)',
            fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          ТОП
        </button>
        {allLetters.map(letter => {
          const has = availableLetters.has(letter)
          const isActive = activeLetter === letter
          return (
            <button
              key={letter}
              onClick={() => has && setActiveLetter(letter)}
              style={{
                width: 32, height: 32, borderRadius: 6, border: 'none',
                cursor: has ? 'pointer' : 'not-allowed',
                background: isActive ? 'var(--accent)' : 'var(--surface-2)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 500,
                opacity: has ? 1 : 0.3,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (has && !isActive) e.currentTarget.style.background = 'var(--border)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Brands grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }} className="brands-grid">
        {displayBrands.map(brand => (
          <Link key={brand.brand_id} href={`/brands/${brand.brand_id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              height: 80, background: 'var(--surface)',
              border: '0.5px solid var(--border)', borderRadius: 8,
              padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'inherit', textAlign: 'center', lineHeight: 1.3, letterSpacing: 0.3 }}>
                {brand.NAME}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!activeLetter && allBrands.length > popularBrands.length && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/catalog" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Показать все {allBrands.length} брендов →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) { .brands-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 767px) { .brands-grid { grid-template-columns: repeat(3, 1fr) !important; } }
      `}</style>
    </section>
  )
}

export default function HomePage() {
  const city = useCityStore(s => s.city)

  const { data: promotions = [], isLoading: promoLoading } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: () => api.get('/api/promotions', { params: { active: true } }).then(r => r.data.data),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  const { data: hitsData } = useQuery({
    queryKey: ['hits', city],
    queryFn: () => api.get('/api/products', { params: { sort: 'rating', limit: 8, city: city || undefined } }).then(r => r.data),
  })
  const { data: exclusivesData } = useQuery({
    queryKey: ['exclusives', city],
    queryFn: () => api.get('/api/products', { params: { is_exclusive: 1, limit: 6, city: city || undefined } }).then(r => r.data),
  })
  const { data: popularBrands = [] } = useQuery({
    queryKey: ['brands', 'popular'],
    queryFn: () => api.get('/api/brands', { params: { sort: 'popular', limit: 12 } }).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })
  const { data: allBrands = [] } = useQuery({
    queryKey: ['brands', 'all'],
    queryFn: () => api.get('/api/brands').then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  })

  const rootCats = categories.filter(c => !c.parent_id)
  const hits = hitsData?.data || []
  const exclusives = exclusivesData?.data || []

  return (
    <div style={{ maxWidth: 1536, margin: '0 auto', padding: '24px 24px 80px' }}>

      {/* Hero */}
      <section style={{ marginBottom: 48 }}>
        {promoLoading ? <Skeleton height={240} borderRadius={12} /> : <HeroSlider promotions={promotions} />}
      </section>

      {/* Quick categories — равная сетка с SVG-иконками */}
      {rootCats.length > 0 && (
        <FadeInSection delay={0.05}>
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
              Категории товаров
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="cat-grid">
              {rootCats.slice(0, 8).map((cat) => {
                const CatIcon = CAT_ICONS[cat.slug] || CAT_ICONS.default
                return (
                  <Link key={cat.category_id} href={`/catalog/${cat.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--surface)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 12,
                      padding: 20,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      height: 180,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <CatIcon size={48} color="var(--accent)" strokeWidth={1.5} />
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{cat.NAME}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)' }}>Смотреть все →</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
          <style>{`
            @media (max-width: 767px) { .cat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          `}</style>
        </FadeInSection>
      )}

      {/* Hits */}
      <FadeInSection delay={0.05}>
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Хиты продаж</h2>
            <Link href="/catalog?sort=rating" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Смотреть все →</Link>
          </div>
          {!hitsData ? (
            <div className="mobile-scroll-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="mobile-scroll-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {hits.map((p, i) => (
                <motion.div key={p.product_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </FadeInSection>

      {/* Calculator preview */}
      <FadeInSection><CalculatorPreview /></FadeInSection>

      {/* Promotions */}
      {promotions.length > 0 && (
        <FadeInSection>
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>Акции</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {promotions.map(promo => (
                <div key={promo.promotion_id} style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                  borderRadius: 12, padding: '24px 28px',
                }}>
                  <div style={{
                    display: 'inline-block', background: 'rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: 10, fontWeight: 600,
                    padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 10,
                  }}>Акция</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{promo.NAME}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 1.5 }}>{promo.description}</p>
                  <Link href="/catalog">
                    <button style={{
                      background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 6, padding: '8px 18px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}>
                      Узнать больше
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Exclusives */}
      {exclusives.length > 0 && (
        <FadeInSection>
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--badge-exclusive-text)' }}>
                Эксклюзивно в ТД Сток
              </h2>
              <Link href="/catalog?is_exclusive=1" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Смотреть все →</Link>
            </div>
            <div className="mobile-scroll-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {exclusives.map((p, i) => (
                <motion.div key={p.product_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Master of the week */}
      <FadeInSection><MasterOfTheWeekBlock /></FadeInSection>

      {/* Brands */}
      {(popularBrands.length > 0 || allBrands.length > 0) && (
        <FadeInSection>
          <BrandsBlock popularBrands={popularBrands} allBrands={allBrands} />
        </FadeInSection>
      )}

    </div>
  )
}
