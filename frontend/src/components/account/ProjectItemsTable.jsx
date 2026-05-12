'use client'
import { getImageUrl } from '@/utils/getImageUrl'
import { formatPrice } from '@/utils/formatPrice'
import useProjectsStore from '@/store/projectsStore'
import useCartStore from '@/store/cartStore'
import useUiStore from '@/store/uiStore'

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Запланировано', color: 'var(--text-muted)' },
  { value: 'in_cart', label: 'В корзине', color: 'var(--info)' },
  { value: 'purchased', label: 'Куплено', color: 'var(--success)' },
  { value: 'cancelled', label: 'Отменено', color: 'var(--danger)' },
]

export default function ProjectItemsTable({ projectId, items, readOnly = false }) {
  const updateItemStatus = useProjectsStore(s => s.updateItemStatus)
  const removeItem = useProjectsStore(s => s.removeItemFromProject)
  const addItem = useCartStore(s => s.addItem)
  const addToast = useUiStore(s => s.addToast)

  const handleStatusChange = (productId, newStatus) => {
    updateItemStatus(projectId, productId, newStatus)

    if (newStatus === 'in_cart') {
      const item = items.find(i => i.product_id === productId)
      if (item) {
        addItem({
          product_id: item.product_id,
          name:       item.name,
          image:      item.image,
          price:      item.price_fixed,
        }, item.quantity_planned)
        addToast(`${item.name} добавлен в корзину`, 'success')
      }
    }
  }

  if (!items || items.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 20px',
        background: 'var(--surface-2)', borderRadius: 8,
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        Позиции не добавлены
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Товар', 'Запланировано', 'Куплено', 'Цена за ед.', 'Сумма', !readOnly ? 'Статус' : '', !readOnly ? '' : ''].filter(Boolean).map(col => (
              <th key={col} style={{
                padding: '10px 12px', textAlign: 'left',
                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const statusInfo = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0]
            const total = item.price_fixed * item.quantity_planned

            return (
              <tr
                key={item.product_id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  opacity: item.status === 'cancelled' ? 0.5 : 1,
                }}
              >
                {/* Product */}
                <td style={{ padding: '12px', minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      onError={e => { e.target.src = '/images/placeholder.jpg' }}
                    />
                    <div style={{
                      fontSize: 13, color: 'var(--text)', lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.name}
                    </div>
                  </div>
                </td>

                {/* Planned */}
                <td style={{ padding: '12px', color: 'var(--text)', textAlign: 'center',  }}>
                  {item.quantity_planned}
                </td>

                {/* Bought */}
                <td style={{ padding: '12px', color: 'var(--text)', textAlign: 'center',  }}>
                  {item.quantity_bought || 0}
                </td>

                {/* Price */}
                <td style={{ padding: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {formatPrice(item.price_fixed)}
                </td>

                {/* Total */}
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  {formatPrice(total)}
                </td>

                {/* Status */}
                {!readOnly && (
                  <td style={{ padding: '12px' }}>
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.product_id, e.target.value)}
                      style={{
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer',
                        color: statusInfo.color, fontWeight: 600,
                      }}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                )}

                {/* Readonly status badge */}
                {readOnly && (
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: `${statusInfo.color}22`, color: statusInfo.color,
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                )}

                {/* Remove */}
                {!readOnly && (
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => removeItem(projectId, item.product_id)}
                      style={{
                        background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                        padding: '4px 8px', cursor: 'pointer', color: 'var(--danger)', fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
