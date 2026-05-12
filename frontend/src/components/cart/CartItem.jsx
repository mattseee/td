'use client'
import Link from 'next/link'
import { getImageUrl } from '@/utils/getImageUrl'
import { formatPrice } from '@/utils/formatPrice'
import Stepper from '@/components/ui/Stepper'
import useCartStore from '@/store/cartStore'

export default function CartItem({ item }) {
  const { removeItem, updateQuantity } = useCartStore()

  return (
    <div style={{
      display: 'flex', gap: 16, padding: '16px 0',
      borderBottom: '1px solid var(--border)',
      alignItems: 'flex-start',
    }}>
      {/* Image */}
      <Link href={`/product/${item.product_id}`} style={{ flexShrink: 0 }}>
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          onError={e => { e.target.src = '/images/placeholder.jpg' }}
          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, display: 'block' }}
        />
      </Link>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/product/${item.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: 'var(--text)', marginBottom: 4 }}>
            {item.name}
          </div>
        </Link>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          {item.sku}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Stepper
            value={item.quantity}
            min={1}
            max={999}
            onChange={(v) => updateQuantity(item.product_id, v)}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            × {formatPrice(item.price)}
          </span>
        </div>
      </div>

      {/* Right side: total + delete */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
        <span style={{
          fontSize: 16, fontWeight: 700,
          color: 'var(--text)',
        }}>
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          onClick={() => removeItem(item.product_id)}
          title="Удалить"
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
            color: 'var(--danger)', fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
