'use client'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import api from '@/utils/api'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const addToast = useUiStore(s => s.addToast)

  // Profile form
  const profileForm = useForm({
    defaultValues: { name: '', email: '', phone: '' },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name:  user.name  || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const profileMutation = useMutation({
    mutationFn: (data) => api.put('/api/account/profile', data).then(r => r.data),
    onSuccess: (res) => {
      setUser(res.data)
      addToast('Профиль обновлён', 'success')
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Ошибка обновления', 'error')
    },
  })

  // Password form
  const passwordForm = useForm({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put('/api/account/password', data).then(r => r.data),
    onSuccess: () => {
      addToast('Пароль изменён', 'success')
      passwordForm.reset()
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Ошибка смены пароля', 'error')
    },
  })

  const onProfileSubmit = (data) => profileMutation.mutate(data)

  const onPasswordSubmit = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Пароли не совпадают' })
      return
    }
    passwordMutation.mutate({ oldPassword: data.oldPassword, newPassword: data.newPassword })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
        Профиль
      </h1>

      {/* Profile data */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Личные данные</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Имя"
            placeholder="Иван Иванов"
            {...profileForm.register('name')}
            error={profileForm.formState.errors.name?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="mail@example.com"
            {...profileForm.register('email', {
              required: 'Введите email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Некорректный email' },
            })}
            error={profileForm.formState.errors.email?.message}
          />
          <Input
            label="Телефон"
            placeholder="+7 (999) 123-45-67"
            {...profileForm.register('phone', {
              pattern: { value: /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/, message: 'Укажите российский номер' },
            })}
            error={profileForm.formState.errors.phone?.message}
          />
          <div>
            <Button type="submit" disabled={profileMutation.isPending}>
              {profileMutation.isPending ? 'Сохраняем...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Смена пароля</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Текущий пароль"
            type="password"
            placeholder="••••••••"
            {...passwordForm.register('oldPassword', { required: 'Введите текущий пароль' })}
            error={passwordForm.formState.errors.oldPassword?.message}
          />
          <Input
            label="Новый пароль"
            type="password"
            placeholder="Минимум 8 символов"
            {...passwordForm.register('newPassword', {
              required: 'Введите новый пароль',
              minLength: { value: 8, message: 'Минимум 8 символов' },
            })}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Повторите новый пароль"
            type="password"
            placeholder="••••••••"
            {...passwordForm.register('confirmPassword', { required: 'Подтвердите пароль' })}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <div>
            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? 'Меняем...' : 'Сменить пароль'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
