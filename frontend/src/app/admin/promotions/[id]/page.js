'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import DataTable from '@/components/admin/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import useUiStore from '@/store/uiStore'
import { formatPrice } from '@/utils/formatPrice'
import { getImageUrl } from '@/utils/getImageUrl'
import { useDebounce } from '@/hooks/useDebounce'

export default function AdminProductsPage() {
  const router = useRouter()
  const addToast = useUiStore(s => s.addToast)

  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [confirmProduct, setConfirmProduct] = useState(null)

  const debouncedSearch = useDebounce(search, 400)
  const LIMIT = 20

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data.data || [])).catch(() => {})
  }, [])

  const loadProducts = useCallback(() => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (debouncedSearch) params.q = debouncedSearch
    if (categoryId) params.category_id = categoryId
    api.get('/api/admin/products', { params })
      .then(r => { if (r.data.success) { setProducts(r.data.data); setTotal(r.data.total) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, debouncedSearch, categoryId])

  useEffect(() => { loadProducts() }, [loadProducts])
  useEffect(() => { setPage(1) }, [debouncedSearch, categoryId])

  async function handleDelete() {
    if (!confirmProduct) return
    try {
      await api.delete(`/api/admin/products/${confirmProduct.product_id}`)
      addToast('Товар удалён', 'success')
      loadProducts()
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка удаления', 'error')
    } finally {
      setConfirmProduct(null)
    }
  }

  const columns = [
    {
      key: 'main_image', label: 'Фото',
      render: row => (
        <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0 }}>
          {row.main_image
            ? <img src={getImageUrl(row.main_image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 18 }}>📷</div>
          }
        </div>
      )
    },
    { key: 'NAME', label: 'Название', sortable: true },
    { key: 'sku', label: 'SKU' },
    { key: 'category_name', label: 'Категория' },
    { key: 'brand_name', label: 'Бренд' },
    {
      key: 'min_price', label: 'Цена', sortable: true,
      render: row => row.min_price ? formatPrice(row.min_price) : <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'actions', label: 'Действия',
      render: row => (
        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/admin/products/${row.product_id}/edit`)}
            style={actionBtn('var(--info)')}
          >Изменить</button>
          <button
            onClick={() => setConfirmProduct(row)}
            style={actionBtn('var(--danger)')}
          >Удалить</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Товары
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по названию или SKU..."
          style={inputStyle}
        />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
          <option value="">Все категории</option>
          {flattenCategories(categories).map(c => <option key={c.category_id} value={c.category_id}>{c._label}</option>)}
        </select>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}><Skeleton height={300} borderRadius={8} /></div>
          : <DataTable
              columns={columns}
              data={products}
              onRowClick={row => router.push(`/admin/products/${row.product_id}/edit`)}
              emptyText="Товары не найдены"
            />
        }
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>

      <Modal isOpen={!!confirmProduct} onClose={() => setConfirmProduct(null)} title="Удалить товар">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Удалить товар «{confirmProduct?.NAME}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={handleDelete}>Удалить</Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmProduct(null)}>Отмена</Button>
        </div>
      </Modal>
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
  minWidth: 240,
}

function actionBtn(color) {
  return {
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

function flattenCategories(categories, parentId = null, depth = 0) {
  const result = []
  const children = categories.filter(c => (c.parent_id ?? null) === parentId)
  for (const c of children) {
    result.push({ ...c, _label: '  '.repeat(depth) + c.NAME })
    result.push(...flattenCategories(categories, c.category_id, depth + 1))
  }
  return result
}
