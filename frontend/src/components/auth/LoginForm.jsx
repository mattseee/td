'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/utils/api'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore(s => s.login)
  const addToast = useUiStore(s => s.addToast)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async ({ email, password, remember }) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { token, user } = res.data.data
      login(user, token, remember)
      addToast(`Добро пожаловать, ${user.name || user.email}!`, 'success')
      const redirect = searchParams.get('redirect') || '/account'
      router.push(redirect)
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка входа', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          style={{ ...inputStyle, borderColor: errors.email ? 'var(--danger)' : 'var(--border)' }}
          {...register('email', {
            required: 'Введите email',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Некорректный email' },
          })}
        />
        {errors.email && <div style={errorStyle}>{errors.email.message}</div>}
      </div>

      <div>
        <label style={labelStyle}>Пароль</label>
        <input
          type="password"
          placeholder="Минимум 8 символов"
          style={{ ...inputStyle, borderColor: errors.password ? 'var(--danger)' : 'var(--border)' }}
          {...register('password', {
            required: 'Введите пароль',
            minLength: { value: 8, message: 'Минимум 8 символов' },
          })}
        />
        {errors.password && <div style={errorStyle}>{errors.password.message}</div>}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
        <input type="checkbox" {...register('remember')} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
        <span style={{ color: 'var(--text-muted)' }}>Запомнить меня</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? 'var(--border)' : 'var(--accent)',
          border: 'none', borderRadius: 8, padding: '13px 0',
          fontSize: 15, fontWeight: 700, color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
        }}
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
        Нет аккаунта?{' '}
        <Link href="/auth/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Регистрация
        </Link>
      </div>
    </form>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const inputStyle = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }
const errorStyle = { color: 'var(--danger)', fontSize: 12, marginTop: 4 }
