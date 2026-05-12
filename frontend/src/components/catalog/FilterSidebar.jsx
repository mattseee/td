'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import RangeSlider from '@/components/ui/RangeSlider'
import Button from '@/components/ui/Button'
import api from '@/utils/api'

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 0 10px', color: 'var(--text)', fontSize: 13, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {title}
        <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  )
}

// Determine if category is climate-related (category_id=2 or child of it)
function isClimateCat(categoryId, categories) {
  if (!categoryId) return false
  const id = parseInt(categoryId)
  if (id === 2) return true
  const cat = categories.find(c => c.category_id === id)
  if (!cat) return false
  // walk up the tree
  let current = cat
  while (current) {
    if (current.category_id === 2) return true
    current = categories.find(c => c.category_id === current.parent_id)
  }
  return false
}

export default function FilterSidebar({ filters, categories, brands, onFilterChange, currentCategoryId }) {
  const [brandSearch, setBrandSearch] = useState('')

  const roots = categories.filter(c => !c.parent_id)
  const children = categories.filter(c => c.parent_id)
  const isClimate = isClimateCat(currentCategoryId, categories)

  // Fetch dynamic specs when a category is selected
  const { data: categorySpecs = [] } = useQuery({
    queryKey: ['category-specs', currentCategoryId],
    queryFn: () => api.get(`/api/categories/${currentCategoryId}/specs`).then(r => r.data.data),
    enabled: !!currentCategoryId,
    staleTime: 5 * 60 * 1000,
  })

  // Multi-brand helpers
  const selectedBrandIds = filters.brand_ids
    ? filters.brand_ids.split(',').map(Number).filter(Boolean)
    : filters.brand_id ? [parseInt(filters.brand_id)] : []

  const toggleBrand = (brandId) => {
    const next = selectedBrandIds.includes(brandId)
      ? selectedBrandIds.filter(id => id !== brandId)
      : [...selectedBrandIds, brandId]
    const updated = { ...filters, page: undefined }
    delete updated.brand_id
    if (next.length > 0) updated.brand_ids = next.join(',')
    else delete updated.brand_ids
    onFilterChange(updated)
  }

  const filteredBrands = brandSearch.trim()
    ? brands.filter(b => b.NAME.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands

  // Spec filter helpers
  const getSpecValue = (specName) => filters[`spec_${specName}`] || null

  const toggleSpec = (specName, specValue) => {
    const current = filters[`spec_${specName}`]
    const updated = { ...filters, page: undefined }
    if (current === specValue) delete updated[`spec_${specName}`]
    else updated[`spec_${specName}`] = specValue
    onFilterChange(updated)
  }

  const update = (key, value) => onFilterChange({ ...filters, [key]: value || undefined, page: undefined })
  const toggle = (key) => update(key, filters[key] === '1' ? undefined : '1')

  return (
    <div style={{ fontSize: 14 }}>

      {/* Categories */}
      <Section title="Категории">
        <Link href="/catalog" style={{ display: 'block', padding: '5px 0', color: !filters.category_id ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: !filters.category_id ? 600 : 400, textDecoration: 'none' }}>
          Все категории
        </Link>
        {roots.map(root => (
          <div key={root.category_id}>
            <button onClick={() => update('category_id', root.category_id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0',
              textAlign: 'left', width: '100%',
              color: parseInt(filters.category_id) === root.category_id ? 'var(--accent)' : 'var(--text)',
              fontSize: 13, fontWeight: parseInt(filters.category_id) === root.category_id ? 600 : 400,
            }}>
              {root.NAME}
            </button>
            {children.filter(c => c.parent_id === root.category_id).map(sub => (
              <button key={sub.category_id} onClick={() => update('category_id', sub.category_id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 4px 16px',
                textAlign: 'left', width: '100%',
                color: parseInt(filters.category_id) === sub.category_id ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 12,
              }}>
                {sub.NAME}
              </button>
            ))}
          </div>
        ))}
      </Section>

      {/* Brands — multi-select with search */}
      <Section title="Бренды">
        <input
          type="text"
          placeholder="Поиск бренда..."
          value={brandSearch}
          onChange={e => setBrandSearch(e.target.value)}
          style={{
            width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '6px 10px', color: 'var(--text)', fontSize: 12,
            outline: 'none', marginBottom: 8,
          }}
        />
        {filteredBrands.map(brand => (
          <label key={brand.brand_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedBrandIds.includes(brand.brand_id)}
              onChange={() => toggleBrand(brand.brand_id)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 13 }}>{brand.NAME}</span>
          </label>
        ))}
        {filteredBrands.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>Ничего не найдено</div>
        )}
      </Section>

      {/* Price */}
      <Section title="Цена">
        <RangeSlider
          min={0} max={200000} step={500}
          value={[parseInt(filters.price_min) || 0, parseInt(filters.price_max) || 200000]}
          onChange={([min, max]) => onFilterChange({
            ...filters,
            price_min: min > 0 ? min : undefined,
            price_max: max < 200000 ? max : undefined,
            page: undefined,
          })}
        />
      </Section>

      {/* Stock & exclusive */}
      <Section title="Наличие и тип">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.in_stock === '1'} onChange={() => toggle('in_stock')} style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
          <span style={{ fontSize: 13 }}>В наличии</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.is_exclusive === '1'} onChange={() => toggle('is_exclusive')} style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
          <span style={{ fontSize: 13 }}>Только эксклюзивы</span>
        </label>
      </Section>

      {/* Climate filters */}
      {isClimate && (
        <Section title="Климатика">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Мощность охлаждения (кВт)</div>
            <RangeSlider min={0} max={15} step={0.5}
              value={[parseFloat(filters.power_cold_min) || 0, parseFloat(filters.power_cold_max) || 15]}
              onChange={([min, max]) => onFilterChange({ ...filters, power_cold_min: min > 0 ? min : undefined, power_cold_max: max < 15 ? max : undefined, page: undefined })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Мощность обогрева (кВт)</div>
            <RangeSlider min={0} max={18} step={0.5}
              value={[parseFloat(filters.power_heat_min) || 0, parseFloat(filters.power_heat_max) || 18]}
              onChange={([min, max]) => onFilterChange({ ...filters, power_heat_min: min > 0 ? min : undefined, power_heat_max: max < 18 ? max : undefined, page: undefined })} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Расход воздуха (м³/ч)</div>
            <RangeSlider min={0} max={1500} step={50}
              value={[parseFloat(filters.air_flow_min) || 0, parseFloat(filters.air_flow_max) || 1500]}
              onChange={([min, max]) => onFilterChange({ ...filters, air_flow_min: min > 0 ? min : undefined, air_flow_max: max < 1500 ? max : undefined, page: undefined })} />
          </div>
        </Section>
      )}

      {/* Dynamic spec filters */}
      {categorySpecs.length > 0 && categorySpecs.map(spec => (
        <Section key={spec.name} title={spec.name} defaultOpen={false}>
          {spec.values.map(val => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={getSpecValue(spec.name) === val}
                onChange={() => toggleSpec(spec.name, val)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13 }}>{val}</span>
            </label>
          ))}
        </Section>
      ))}

      <Button variant="ghost" size="sm" fullWidth onClick={() => onFilterChange({})}>
        Сбросить фильтры
      </Button>
    </div>
  )
}
