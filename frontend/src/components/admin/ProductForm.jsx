'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import useUiStore from '@/store/uiStore'
import Button from '@/components/ui/Button'
import SpecificationsEditor from './SpecificationsEditor'
import PricesEditor from './PricesEditor'
import MediaUploader from './MediaUploader'

const fieldStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
}

const sectionStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: 'var(--text-muted)',
  marginBottom: 6,
  fontWeight: 500,
}

const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: 16,
  fontWeight: 700,
}

export default function ProductForm({ initialData, productId }) {
  const router = useRouter()
  const addToast = useUiStore(s => s.addToast)

  const [form, setForm] = useState({
    NAME: '', sku: '', description: '', hs_code: '', weight: '', is_exclusive: false,
    category_id: '', brand_id: '', supplier_id: '',
    power_cold: '', power_heat: '', size_internal: '', size_external: '', air_flow: '',
  })
  const [specs, setSpecs] = useState([])
  const [prices, setPrices] = useState([])
  const [media, setMedia] = useState([])

  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/categories'),
      api.get('/api/brands'),
      api.get('/api/suppliers'),
    ]).then(([c, b, s]) => {
      setCategories(c.data.data || [])
      setBrands(b.data.data || [])
      setSuppliers(s.data.data || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!initialData) return
    const p = initialData
    setForm({
      NAME: p.NAME || '',
      sku: p.sku || '',
      description: p.description || '',
      hs_code: p.hs_code || '',
      weight: p.weight ?? '',
      is_exclusive: !!p.is_exclusive,
      category_id: p.category_id ?? '',
      brand_id: p.brand_id ?? '',
      supplier_id: p.supplier_id ?? '',
      power_cold: p.power_cold ?? '',
      power_heat: p.power_heat ?? '',
      size_internal: p.size_internal || '',
      size_external: p.size_external || '',
      air_flow: p.air_flow ?? '',
    })
    setSpecs(p.specifications || [])
    setPrices(p.prices || [])
    setMedia(p.media || [])
  }, [initialData])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.NAME.trim()) {
      addToast('Введите название товара', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        weight: form.weight !== '' ? parseFloat(form.weight) : null,
        power_cold: form.power_cold !== '' ? parseFloat(form.power_cold) : null,
        power_heat: form.power_heat !== '' ? parseFloat(form.power_heat) : null,
        air_flow: form.air_flow !== '' ? parseFloat(form.air_flow) : null,
        size_internal: form.size_internal || null,
        size_external: form.size_external || null,
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        supplier_id: form.supplier_id || null,
        specifications: specs,
        prices: prices.map(p => ({
          ...p,
          branch_id: p.branch_id ? parseInt(p.branch_id) : null,
          price: p.price ? parseFloat(p.price) : null,
          discount_price: p.discount_price ? parseFloat(p.discount_price) : null,
        })),
      }

      let res
      if (productId) {
        res = await api.put(`/api/admin/products/${productId}`, payload)
        addToast('Товар обновлён', 'success')
        router.push('/admin/products')
      } else {
        res = await api.post('/api/admin/products', payload)
        addToast('Товар создан. Добавьте медиафайлы.', 'success')
        const newId = res.data.data.product_id
        router.push(`/admin/products/${newId}/edit`)
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка сохранения'
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const flatCategories = flattenCategories(categories)

  return (
    <form onSubmit={handleSubmit}>
      {/* Основное */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Основное</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Название *</label>
            <input style={fieldStyle} value={form.NAME} onChange={e => set('NAME', e.target.value)} placeholder="Название товара" />
          </div>
          <div>
            <label style={labelStyle}>Категория</label>
            <select style={fieldStyle} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— не выбрано —</option>
              {flatCategories.map(c => <option key={c.category_id} value={c.category_id}>{c._label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Бренд</label>
            <select style={fieldStyle} value={form.brand_id} onChange={e => set('brand_id', e.target.value)}>
              <option value="">— не выбрано —</option>
              {brands.map(b => <option key={b.brand_id} value={b.brand_id}>{b.NAME}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Поставщик</label>
            <select style={fieldStyle} value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
              <option value="">— не выбрано —</option>
              {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.NAME}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>SKU</label>
            <input style={fieldStyle} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Артикул" />
          </div>
          <div>
            <label style={labelStyle}>HS-код</label>
            <input style={fieldStyle} value={form.hs_code} onChange={e => set('hs_code', e.target.value)} placeholder="HS-код" />
          </div>
          <div>
            <label style={labelStyle}>Вес (кг)</label>
            <input type="number" min="0" step="0.01" style={fieldStyle} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input
              type="checkbox" id="is_exclusive"
              checked={form.is_exclusive}
              onChange={e => set('is_exclusive', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="is_exclusive" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Эксклюзивный товар</label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Описание</label>
            <textarea
              rows={4}
              style={{ ...fieldStyle, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Описание товара"
            />
          </div>
        </div>
      </div>

      {/* Технические характеристики */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Технические характеристики (климатика)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Мощность охлаждения (кВт)</label>
            <input type="number" step="0.01" style={fieldStyle} value={form.power_cold} onChange={e => set('power_cold', e.target.value)} placeholder="—" />
          </div>
          <div>
            <label style={labelStyle}>Мощность обогрева (кВт)</label>
            <input type="number" step="0.01" style={fieldStyle} value={form.power_heat} onChange={e => set('power_heat', e.target.value)} placeholder="—" />
          </div>
          <div>
            <label style={labelStyle}>Воздухообмен (м³/ч)</label>
            <input type="number" step="0.01" style={fieldStyle} value={form.air_flow} onChange={e => set('air_flow', e.target.value)} placeholder="—" />
          </div>
          <div>
            <label style={labelStyle}>Габариты внутреннего блока</label>
            <input style={fieldStyle} value={form.size_internal} onChange={e => set('size_internal', e.target.value)} placeholder="Ш×В×Г, мм" />
          </div>
          <div>
            <label style={labelStyle}>Габариты внешнего блока</label>
            <input style={fieldStyle} value={form.size_external} onChange={e => set('size_external', e.target.value)} placeholder="Ш×В×Г, мм" />
          </div>
        </div>
      </div>

      {/* Характеристики */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Характеристики</div>
        <SpecificationsEditor specs={specs} onChange={setSpecs} />
      </div>

      {/* Цены */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Цены по филиалам</div>
        <PricesEditor prices={prices} onChange={setPrices} />
      </div>

      {/* Медиа */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Медиафайлы</div>
        {productId ? (
          <MediaUploader productId={productId} media={media} onMediaChange={setMedia} />
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            ⚠️ Медиафайлы можно добавить только после сохранения товара. После создания вы будете перенаправлены на страницу редактирования.
          </p>
        )}
      </div>

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Сохранение...' : productId ? 'Сохранить изменения' : 'Создать товар'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/products')}>
          Отмена
        </Button>
      </div>
    </form>
  )
}

function flattenCategories(categories, parentId = null, depth = 0) {
  const result = []
  const children = categories.filter(c => (c.parent_id ?? null) === parentId)
  for (const c of children) {
    result.push({ ...c, _label: '  '.repeat(depth) + c.NAME })
    result.push(...flattenCategories(categories, c.category_id, depth + 1))
  }
  return result
}
