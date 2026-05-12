import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata = { title: 'Вход — ТД Сток' }

export default function LoginPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>ТД</span>
            </div>
            <span style={{ color: 'var(--brand-navy)', fontWeight: 700, fontSize: 18, letterSpacing: '0.5px' }}>ТД СТОК</span>
          </Link>
          <h1 style={{ marginTop: 16, fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Вход в аккаунт</h1>
          <p style={{ marginTop: 6, fontSize: 14, color: 'var(--text-muted)' }}>Войдите, чтобы продолжить</p>
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '32px 28px',
        }}>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
