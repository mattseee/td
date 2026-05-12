'use client'
import { formatPrice } from '@/utils/formatPrice'

const STATUS_COLORS = {
  planned: '#7A8099',
  in_cart: '#4D9EFF',
  purchased: '#2ECC8A',
  cancelled: '#FF4D6D',
}

const STATUS_LABELS = {
  planned: 'Запланировано',
  in_cart: 'В корзине',
  purchased: 'Куплено',
  cancelled: 'Отменено',
}

export default function ProjectBudgetChart({ items, budget }) {
  const totals = {}
  for (const item of items) {
    const status = item.status || 'planned'
    const amount = item.price_fixed * item.quantity_planned
    totals[status] = (totals[status] || 0) + amount
  }

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

  if (grandTotal === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
        Добавьте позиции в смету
      </div>
    )
  }

  // Build SVG pie chart
  const SIZE = 180
  const RADIUS = 70
  const CENTER = SIZE / 2
  let startAngle = -Math.PI / 2

  const segments = Object.entries(totals).map(([status, value]) => {
    const pct = value / grandTotal
    const angle = pct * 2 * Math.PI
    const x1 = CENTER + RADIUS * Math.cos(startAngle)
    const y1 = CENTER + RADIUS * Math.sin(startAngle)
    const endAngle = startAngle + angle
    const x2 = CENTER + RADIUS * Math.cos(endAngle)
    const y2 = CENTER + RADIUS * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const d = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
    startAngle = endAngle
    return { status, value, pct, d }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      {/* SVG chart */}
      <div style={{ flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {segments.map((seg, i) => (
            <path
              key={seg.status}
              d={seg.d}
              fill={STATUS_COLORS[seg.status] || '#7A8099'}
              stroke="var(--surface)"
              strokeWidth="2"
            />
          ))}
          {/* Center hole */}
          <circle cx={CENTER} cy={CENTER} r={40} fill="var(--surface)" />
          {/* Center text */}
          <text x={CENTER} y={CENTER - 4} textAnchor="middle" fill="var(--text)" fontSize="11" fontWeight="600">
            Всего
          </text>
          <text x={CENTER} y={CENTER + 12} textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">
            {Math.round(grandTotal / 1000)}к ₽
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map(seg => (
          <div key={seg.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3, flexShrink: 0,
              background: STATUS_COLORS[seg.status] || '#7A8099',
            }} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                {STATUS_LABELS[seg.status] || seg.status}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {formatPrice(seg.value)} · {Math.round(seg.pct * 100)}%
              </div>
            </div>
          </div>
        ))}

        {budget > 0 && (
          <div style={{
            marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border)',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            Бюджет: <strong style={{ color: 'var(--text)' }}>{formatPrice(budget)}</strong>
            <br />
            {grandTotal > budget ? (
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                Превышение на {formatPrice(grandTotal - budget)}
              </span>
            ) : (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                Остаток: {formatPrice(budget - grandTotal)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
