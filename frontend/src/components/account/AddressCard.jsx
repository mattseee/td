'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

export default function AddressCard({ address, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{address.city}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{address.address}</div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          aria-label={`Удалить адрес ${address.city}`}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '6px 10px', cursor: 'pointer', color: 'var(--danger)',
            fontSize: 13, flexShrink: 0, transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          Удалить
        </button>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Удалить адрес"
      >
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>
          {address.city}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          {address.address}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={() => { onDelete(address.address_id); setConfirmOpen(false) }}>
            Удалить
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </>
  )
}
