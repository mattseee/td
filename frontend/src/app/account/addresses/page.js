'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import AddressCard from '@/components/account/AddressCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import useUiStore from '@/store/uiStore'

export default function AddressesPage() {
  const qc = useQueryClient()
  const addToast = useUiStore(s => s.addToast)
  const [showForm, setShowForm] = useState(false)
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['account-addresses'],
    queryFn: () => api.get('/api/account/addresses').then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (body) => api.post('/api/account/addresses', body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-addresses'] })
      qc.invalidateQueries({ queryKey: ['account-addresses-dashboard'] })
      setCity('')
      setAddress('')
      setShowForm(false)
      addToast('Адрес добавлен', 'success')
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Ошибка добавления адреса', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/account/addresses/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-addresses'] })
      qc.invalidateQueries({ queryKey: ['account-addresses-dashboard'] })
      addToast('Адрес удалён', 'success')
    },
    onError: () => addToast('Ошибка удаления', 'error'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!city.trim()) errs.city = 'Введите город'
    if (!address.trim()) errs.address = 'Введите адрес'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    addMutation.mutate({ city: city.trim(), address: address.trim() })
  }

  const addresses = data?.data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          Мои адреса
        </h1>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Новый адрес</h3>
          <Input
            label="Город"
            value={city}
            onChange={e => setCity(e.target.value)}
            error={errors.city}
            placeholder="Москва"
          />
          <Input
            label="Адрес"
            value={address}
            onChange={e => setAddress(e.target.value)}
            error={errors.address}
            placeholder="ул. Примерная, д. 1, кв. 10"
          />
          <Button type="submit" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </form>
      )}

      {/* Loading */}
      {isLoading && [1, 2].map(i => (
        <Skeleton key={i} height={68} borderRadius={10} style={{ marginBottom: 10 }} />
      ))}

      {/* Empty state */}
      {!isLoading && addresses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
          <p style={{ margin: 0, fontSize: 15 }}>У вас нет сохранённых адресов</p>
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>Добавьте адрес для быстрого оформления заказов</p>
        </div>
      )}

      {/* List */}
      {!isLoading && addresses.map(addr => (
        <div key={addr.address_id} style={{ marginBottom: 10 }}>
          <AddressCard address={addr} onDelete={(id) => deleteMutation.mutate(id)} />
        </div>
      ))}
    </div>
  )
}
