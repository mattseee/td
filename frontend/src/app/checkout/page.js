'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { formatPrice } from '@/utils/formatPrice'
import { getImageUrl } from '@/utils/getImageUrl'

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  )
}

function CheckoutContent() {
  const router       = useRouter()
  const queryClient  = useQueryClient()
  const items        = useCartStore(s => s.items)
  const clearCart    = useCartStore(s => s.clearCart)
  const addToast     = useUiStore(s => s.addToast)

  const [step, setStep]             = useState(1) // 1 = delivery, 2 = confirm
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [deliveryType, setDeliveryType] = useState('address') // 'address' | 'pickup'
  const [selectedBranchId, setSelectedBranchId]   = useState(null)
  const [newAddress, setNewAddress] = useState({ city: '', address: '' })
  const [showNewForm, setShowNewForm] = useState(false)

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) router.replace('/cart')
  }, [items, router])

  const { data: addresses = [], isLoading: loadingAddr } = useQuery({
    queryKey: ['account-addresses'],
    queryFn: () => api.get('/api/account/addresses').then(r => r.data.data || []),
  })

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/api/branches').then(r => r.data.data || []),
  })

  const addAddressMutation = useMutation({
    mutationFn: (data) => api.post('/api/account/addresses', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['account-addresses'] })
      setSelectedAddressId(res.data.data.address_id)
      setShowNewForm(false)
      setNewAddress({ city: '', address: '' })
      addToast('Адрес добавлен', 'success')
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Ошибка при добавлении адреса', 'error')
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: (data) => api.post('/api/account/orders', data),
    onSuccess: (res) => {
      clearCart()
      router.push(`/order/success?id=${res.data.data.order_id}&total=${res.data.data.total}`)
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Ошибка при оформлении заказа', 'error')
    },
  })

  const handleAddAddress = () => {
    if (!newAddress.city.trim() || !newAddress.address.trim()) {
      addToast('Заполните город и адрес', 'error')
      return
    }
    addAddressMutation.mutate(newAddress)
  }

  const handleGoToStep2 = () => {
    if (deliveryType === 'address' && !selectedAddressId && !showNewForm) {
      addToast('Выберите адрес доставки', 'error')
      return
    }
    if (deliveryType === 'pickup' && !selectedBranchId) {
      addToast('Выберите филиал для самовывоза', 'error')
      return
    }
    setStep(2)
  }

  const handlePlaceOrder = () => {
    const payload = {
      items: items.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        price:      i.price,
      })),
      address_id: deliveryType === 'address' ? selectedAddressId : null,
      branch_id:  deliveryType === 'pickup'  ? selectedBranchId  : null,
      total,
    }
    createOrderMutation.mutate(payload)
  }

  if (items.length === 0) return null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Link href="/cart" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
          ← Корзина
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          Оформление заказа
        </h1>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {['Доставка', 'Подтверждение'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: step === i + 1 ? 'var(--accent)' : (step > i + 1 ? 'var(--success)' : 'var(--text-muted)'),
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step === i + 1 ? 'var(--accent)' : (step > i + 1 ? 'var(--success)' : 'var(--surface-2)'),
                border: '2px solid currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: (step === i + 1 || step > i + 1) ? 'var(--bg)' : 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: step === i + 1 ? 600 : 400 }}>{label}</span>
            </div>
            {i < 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 12px' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }} className="checkout-layout">
        {/* Left: step content */}
        <div>
          {/* ── STEP 1: Delivery ── */}
          {step === 1 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
                Способ получения
              </h2>

              {/* Delivery type toggle */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {[
                  { value: 'address', label: 'Доставка' },
                  { value: 'pickup',  label: 'Самовывоз' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setDeliveryType(opt.value)} style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                    background: deliveryType === opt.value ? 'var(--accent)' : 'var(--surface-2)',
                    border: `1px solid ${deliveryType === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                    color: deliveryType === opt.value ? 'var(--bg)' : 'var(--text)',
                    fontWeight: deliveryType === opt.value ? 600 : 400,
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Saved addresses */}
              {deliveryType === 'address' && (
                <>
                  {loadingAddr ? (
                    <Skeleton height={60} style={{ marginBottom: 10 }} />
                  ) : (
                    addresses.map(addr => (
                      <label key={addr.address_id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 16px', borderRadius: 8, cursor: 'pointer', marginBottom: 10,
                        background: selectedAddressId === addr.address_id ? 'var(--surface-2)' : 'none',
                        border: `1px solid ${selectedAddressId === addr.address_id ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                        <input
                          type="radio" name="addr"
                          value={addr.address_id}
                          checked={selectedAddressId === addr.address_id}
                          onChange={() => { setSelectedAddressId(addr.address_id); setShowNewForm(false) }}
                          style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{addr.city}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{addr.address}</div>
                        </div>
                      </label>
                    ))
                  )}

                  {/* Add new address form */}
                  {!showNewForm ? (
                    <button onClick={() => { setShowNewForm(true); setSelectedAddressId(null) }}
                      style={{
                        width: '100%', padding: '12px 16px', marginTop: 4,
                        background: 'none', border: '1px dashed var(--border)',
                        borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
                      }}>
                      + Добавить новый адрес
                    </button>
                  ) : (
                    <div style={{ border: '1px solid var(--accent)', borderRadius: 8, padding: 16, marginTop: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Новый адрес</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input
                          placeholder="Город"
                          value={newAddress.city}
                          onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                          style={inputStyle}
                        />
                        <input
                          placeholder="Адрес (улица, дом, квартира)"
                          value={newAddress.address}
                          onChange={e => setNewAddress(p => ({ ...p, address: e.target.value }))}
                          style={inputStyle}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button size="sm" onClick={handleAddAddress} disabled={addAddressMutation.isPending}>
                            {addAddressMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowNewForm(false); setNewAddress({ city: '', address: '' }) }}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Pickup branches */}
              {deliveryType === 'pickup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {branches.map(br => (
                    <label key={br.branch_id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
                      background: selectedBranchId === br.branch_id ? 'var(--surface-2)' : 'none',
                      border: `1px solid ${selectedBranchId === br.branch_id ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                      <input
                        type="radio" name="branch"
                        value={br.branch_id}
                        checked={selectedBranchId === br.branch_id}
                        onChange={() => setSelectedBranchId(br.branch_id)}
                        style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{br.NAME}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{br.city} · {br.address}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <Button variant="primary" size="lg" fullWidth style={{ marginTop: 24 }} onClick={handleGoToStep2}>
                Продолжить
              </Button>
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 2 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
                Подтверждение заказа
              </h2>

              {/* Delivery info */}
              <DeliveryInfo
                deliveryType={deliveryType}
                selectedAddressId={selectedAddressId}
                selectedBranchId={selectedBranchId}
                addresses={addresses}
                branches={branches}
                onEdit={() => setStep(1)}
              />

              {/* Items list */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Состав заказа
                </div>
                {items.map(item => (
                  <div key={item.product_id} style={{
                    display: 'flex', gap: 14, padding: '12px 0',
                    borderBottom: '1px solid var(--border)', alignItems: 'center',
                  }}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      onError={e => { e.target.src = '/images/placeholder.jpg' }}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.sku} · {item.quantity} шт.</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                  ← Назад
                </Button>
                <Button
                  variant="primary" size="lg" style={{ flex: 1 }}
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Оформляем...' : 'Оформить заказ'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, position: 'sticky', top: 80 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            Ваш заказ ({items.reduce((s, i) => s + i.quantity, 0)} шт.)
          </div>
          {items.map(item => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name} × {item.quantity}
              </span>
              <span style={{ flexShrink: 0 }}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600 }}>Итого</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) { .checkout-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

function DeliveryInfo({ deliveryType, selectedAddressId, selectedBranchId, addresses, branches, onEdit }) {
  const addr   = addresses.find(a => a.address_id === selectedAddressId)
  const branch = branches.find(b => b.branch_id === selectedBranchId)

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          {deliveryType === 'address' ? 'Доставка по адресу' : 'Самовывоз'}
        </div>
        {deliveryType === 'address' && addr && (
          <div style={{ fontSize: 14 }}>
            <strong>{addr.city}</strong>, {addr.address}
          </div>
        )}
        {deliveryType === 'pickup' && branch && (
          <div style={{ fontSize: 14 }}>
            <strong>{branch.NAME}</strong> · {branch.city}, {branch.address}
          </div>
        )}
      </div>
      <button onClick={onEdit} style={{
        background: 'none', border: 'none', color: 'var(--accent)',
        cursor: 'pointer', fontSize: 13, flexShrink: 0, marginLeft: 16,
      }}>
        Изменить
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}
