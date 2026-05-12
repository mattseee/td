'use client'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'

const columns = [
  {
    title: 'Покупателям',
    links: [
      { label: 'Как купить', href: '#' },
      { label: 'Доставка и оплата', href: '#' },
      { label: 'Возврат товара', href: '#' },
      { label: 'Гарантии', href: '#' },
    ],
  },
  {
    title: 'Услуги',
    links: [
      { label: 'Калькулятор материалов', href: '/calculator' },
      { label: 'Мастера', href: '/masters' },
      { label: 'Мои проекты', href: '/account/projects' },
      { label: 'Оптовым покупателям', href: '#' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '#' },
      { label: 'Вакансии', href: '#' },
      { label: 'Пресс-центр', href: '#' },
      { label: 'Партнёрам', href: '#' },
    ],
  },
  {
    title: 'Контакты',
    links: [
      { label: 'Москва', href: '#' },
      { label: 'Санкт-Петербург', href: '#' },
      { label: 'Казань', href: '#' },
      { label: 'Все магазины', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--surface-2)',
        borderTop: '0.5px solid var(--border)',
        marginTop: 64,
        paddingBottom: 80,
      }}
      className="footer-wrap"
    >
      <div style={{ maxWidth: 1536, margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) repeat(4, 1fr)', gap: 32, marginBottom: 40 }} className="footer-grid">
          {/* Brand block */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <Logo size="sm" href="/" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 220 }}>
              Торговый Дом Сток — профессиональный строительный маркетплейс
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {['TG', 'VK', 'YT'].map(s => (
                <button key={s} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', fontWeight: 700,
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >{s}</button>
              ))}
            </div>
          </div>

          {columns.map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.title}
              </div>
              {col.links.map(link => (
                <Link key={link.label} href={link.href}
                  style={{ display: 'block', color: 'var(--text-muted)', fontSize: 13, marginBottom: 9, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >{link.label}</Link>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>© 2026 ТД Сток. Торговый Дом Сток</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" style={{ fontSize: 12, color: 'var(--text-subtle)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
            >Политика конфиденциальности</a>
            <a href="#" style={{ fontSize: 12, color: 'var(--text-subtle)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle)'}
            >Пользовательское соглашение</a>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .footer-wrap { padding-bottom: 72px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
