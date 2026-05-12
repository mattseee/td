'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/utils/api'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'

const PHONE_RE = /^\+7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/

export default function RegisterForm() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const addToast = useUiStore(s => s.addToast)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirm: '' },
  })

  const onSubmit = async ({ name, email, phone, password }) => {
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', { name, email, phone, password })
      const { token, user } = res.data.data
      login(user, token)
      addToast('Аккаунт создан! Добро пожаловать!', 'success')
      router.push('/account')
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка регистрации', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Имя</label>
        <input
          placeholder="Иван Петров"
          style={{ ...inputStyle, borderColor: errors.name ? 'var(--danger)' : 'var(--border)' }}
          {...register('name', { required: 'Введите ваше имя' })}
        />
        {errors.name && <div style={errorStyle}>{errors.name.message}</div>}
      </div>

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
        <label style={labelStyle}>Телефон</label>
        <input
          placeholder="+7 (999) 123-45-67"
          style={{ ...inputStyle, borderColor: errors.phone ? 'var(--danger)' : 'var(--border)' }}
          {...register('phone', {
            required: 'Введите телефон',
            pattern: { value: PHONE_RE, message: 'Формат: +7 (999) 123-45-67' },
          })}
        />
        {errors.phone && <div style={errorStyle}>{errors.phone.message}</div>}
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

      <div>
        <label style={labelStyle}>Подтверждение пароля</label>
        <input
          type="password"
          placeholder="Повторите пароль"
          style={{ ...inputStyle, borderColor: errors.confirm ? 'var(--danger)' : 'var(--border)' }}
          {...register('confirm', {
            required: 'Подтвердите пароль',
            validate: v => v === watch('password') || 'Пароли не совпадают',
          })}
        />
        {errors.confirm && <div style={errorStyle}>{errors.confirm.message}</div>}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? 'var(--border)' : 'var(--accent)',
          border: 'none', borderRadius: 8, padding: '13px 0', marginTop: 4,
          fontSize: 15, fontWeight: 700, color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Войти
        </Link>
      </div>
    </form>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }
const inputStyle = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }
const errorStyle = { color: 'var(--danger)', fontSize: 12, marginTop: 4 }
