'use client'

export default function ActiveFilters({ filters, categories, brands, onRemove, onClearAll }) {
  const tags = []

  if (filters.category_id) {
    const cat = categories.find(c => c.category_id === parseInt(filters.category_id))
    if (cat) tags.push({ keys: ['category_id'], label: `Категория: ${cat.NAME}` })
  }

  if (filters.brand_ids) {
    const ids = filters.brand_ids.split(',').map(Number)
    const names = ids.map(id => brands.find(b => b.brand_id === id)?.NAME).filter(Boolean)
    if (names.length) tags.push({ keys: ['brand_ids'], label: `Бренды: ${names.join(', ')}` })
  } else if (filters.brand_id) {
    const brand = brands.find(b => b.brand_id === parseInt(filters.brand_id))
    if (brand) tags.push({ keys: ['brand_id'], label: brand.NAME })
  }

  if (filters.price_min || filters.price_max) {
    const min = filters.price_min ? parseInt(filters.price_min).toLocaleString('ru-RU') + ' ₽' : '0'
    const max = filters.price_max ? parseInt(filters.price_max).toLocaleString('ru-RU') + ' ₽' : '∞'
    tags.push({ keys: ['price_min', 'price_max'], label: `Цена: ${min} — ${max}` })
  }

  if (filters.in_stock === '1') tags.push({ keys: ['in_stock'], label: 'В наличии' })
  if (filters.is_exclusive === '1') tags.push({ keys: ['is_exclusive'], label: 'Эксклюзив' })
  if (filters.q) tags.push({ keys: ['q'], label: `"${filters.q}"` })

  if (filters.power_cold_min || filters.power_cold_max) {
    tags.push({ keys: ['power_cold_min', 'power_cold_max'], label: `Охлаждение: ${filters.power_cold_min || 0}–${filters.power_cold_max || '∞'} кВт` })
  }
  if (filters.power_heat_min || filters.power_heat_max) {
    tags.push({ keys: ['power_heat_min', 'power_heat_max'], label: `Обогрев: ${filters.power_heat_min || 0}–${filters.power_heat_max || '∞'} кВт` })
  }
  if (filters.air_flow_min || filters.air_flow_max) {
    tags.push({ keys: ['air_flow_min', 'air_flow_max'], label: `Воздух: ${filters.air_flow_min || 0}–${filters.air_flow_max || '∞'} м³/ч` })
  }

  Object.keys(filters).forEach(key => {
    if (key.startsWith('spec_')) {
      tags.push({ keys: [key], label: `${key.slice(5)}: ${filters[key]}` })
    }
  })

  if (!tags.length) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Фильтры:</span>
      {tags.map(tag => (
        <span key={tag.keys.join('+')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 4, padding: '3px 8px', fontSize: 12,
        }}>
          {tag.label}
          <button
            onClick={() => onRemove(tag.keys)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >×</button>
        </span>
      ))}
      <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, padding: '3px 8px', textDecoration: 'underline' }}>
        Сбросить всё
      </button>
    </div>
  )
}
