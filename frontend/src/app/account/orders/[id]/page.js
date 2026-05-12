'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/utils/api'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import OrderStatusBadge from '@/components/account/OrderStatusBadge'
import { formatPrice } from '@/utils/formatPrice'
import { formatDate } from '@/utils/formatDate'
import { getImageUrl } from '@/utils/getImageUrl'
import useCartStore from '@/store/cartStore'
import useUiStore from '@/store/uiStore'

export default function OrderDetailPage() {
  const { id } = useParams()
  const addItem = useCartStore(s => s.addItem)
  const addToast = useUiStore(s => s.addToast)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['account-order', id],
    queryFn: () => api.get(`/api/account/orders/${id}`).then(r => r.data.data),
    enabled: !!id,
    retry: false,
  })

  const repeatOrder = () => {
    if (!data?.items?.length) return
    data.items.forEach(item => {
      addItem({
        product_id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        image: item.main_image || null,
        price: item.price,
        branch_id: null,
      }, item.quantity)
    })
    addToast('Товары из заказа добавлены в корзину', 'success')
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton height={300} borderRadius={8} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 12 }}>Заказ не найден или доступ запрещён</p>
        <Link href="/account/orders" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          ← К списку заказов
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/account/orders" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
          ← Мои заказы
        </Link>
        <h1 style={{ fontWeight: 700, fontSize: 22, fontWeight: 700, margin: 0 }}>
          Заказ <span style={{  }}>№{data.order_id}</span>
        </h1>
        <OrderStatusBadge status={data.status} />
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }} className="order-detail-grid">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Дата оформления</div>
          <div style={{ fontWeight: 500 }}>{formatDate(data.created_at)}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Сумма заказа</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
            {formatPrice(data.total)}
          </div>
        </div>
        {(data.addr_city || data.city) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Адрес доставки</div>
            <div style={{ fontWeight: 500 }}>
              {data.addr_city || data.city}, {data.addr_address || data.address}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Товары ({data.items?.length || 0})
        </div>
        {(data.items || []).map(item => (
          <div key={item.order_item_id} style={{
            display: 'flex', gap: 14, padding: '14px 20px',
            borderBottom: '1px solid var(--border)', alignItems: 'center',
          }}>
            <img
              src={getImageUrl(item.main_image)}
              alt={item.product_name}
              onError={e => { e.target.src = '/images/placeholder.jpg' }}
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/product/${item.product_id}`}
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>
                {item.product_name}
              </Link>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.sku} · {item.quantity} шт. × {formatPrice(item.price)}
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Итого:</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
            {formatPrice(data.total)}
          </span>
        </div>
      </div>

      <Button variant="ghost" onClick={repeatOrder}>
        Повторить заказ
      </Button>

      <style>{`
        @media (max-width: 600px) { .order-detail-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
