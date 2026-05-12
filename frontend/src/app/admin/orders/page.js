'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import DataTable from '@/components/admin/DataTable'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { formatPrice } from '@/utils/formatPrice'
import { formatDate } from '@/utils/formatDate'

const STATUSES = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'processing', label: 'В работе' },
  { value: 'completed', label: 'Выполнен' },
  { value: 'cancelled', label: 'Отменён' },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const LIMIT = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (status) params.status = status
    if (debouncedSearch) params.q = debouncedSearch
    api.get('/api/admin/orders', { params })
      .then(r => { if (r.data.success) { setOrders(r.data.data); setTotal(r.data.total) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, status, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [status, debouncedSearch])

  const columns = [
    {
      key: 'order_id', label: '№', sortable: true,
      render: r => <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#{r.order_id}</span>
    },
    {
      key: 'email', label: 'Пользователь',
      render: r => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.email}</div>
          {r.user_name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.user_name}</div>}
        </div>
      )
    },
    {
      key: 'total', label: 'Сумма', sortable: true,
      render: r => <span style={{  }}>{formatPrice(r.total)}</span>
    },
    { key: 'status', label: 'Статус', render: r => <OrderStatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Дата', sortable: true, render: r => formatDate(r.created_at) },
    {
      key: 'actions', label: '',
      render: r => (
        <button
          onClick={e => { e.stopPropagation(); router.push(`/admin/orders/${r.order_id}`) }}
          style={{ background: 'var(--info)22', color: 'var(--info)', border: '1px solid var(--info)44', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Открыть
        </button>
      )
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
        Заказы
      </h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по email..."
          style={inputStyle}
        />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, maxWidth: 180 }}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}><Skeleton height={300} borderRadius={8} /></div>
          : <DataTable
              columns={columns}
              data={orders}
              onRowClick={r => router.push(`/admin/orders/${r.order_id}`)}
              emptyText="Заказы не найдены"
            />
        }
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 14px',
  color: 'var(--text)',
  fontSize: 14,
  minWidth: 200,
}
