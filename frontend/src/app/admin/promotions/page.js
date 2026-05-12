'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/utils/api'
import DataTable from '@/components/admin/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import useUiStore from '@/store/uiStore'
import { formatDate } from '@/utils/formatDate'

const emptyForm = { NAME: '', description: '', valid_from: '', valid_to: '' }

function getPromoStatus(promo) {
  const now = new Date()
  const from = promo.valid_from ? new Date(promo.valid_from) : null
  const to = promo.valid_to ? new Date(promo.valid_to) : null
  if (!from || !to) return { label: 'Без дат', color: 'var(--text-muted)' }
  if (now < from) return { label: 'Будущая', color: 'var(--info)' }
  if (now > to) return { label: 'Завершена', color: 'var(--text-muted)' }
  return { label: 'Активна', color: 'var(--success)' }
}

export default function AdminPromotionsPage() {
  const router = useRouter()
  const addToast = useUiStore(s => s.addToast)
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [confirmPromo, setConfirmPromo] = useState(null)

  function load() {
    setLoading(true)
    api.get('/api/admin/promotions')
      .then(r => { if (r.data.success) setPromos(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function startAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function startEdit(promo) {
    setForm({
      NAME: promo.NAME,
      description: promo.description || '',
      valid_from: promo.valid_from ? promo.valid_from.split('T')[0] : '',
      valid_to: promo.valid_to ? promo.valid_to.split('T')[0] : '',
    })
    setEditId(promo.promotion_id)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    if (!form.NAME.trim()) {
      addToast('Введите название', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        NAME: form.NAME.trim(),
        description: form.description || null,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
      }
      if (editId) {
        await api.put(`/api/admin/promotions/${editId}`, payload)
        addToast('Акция обновлена', 'success')
      } else {
        await api.post('/api/admin/promotions', payload)
        addToast('Акция создана', 'success')
      }
      cancelForm()
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmPromo) return
    try {
      await api.delete(`/api/admin/promotions/${confirmPromo.promotion_id}`)
      addToast('Акция удалена', 'success')
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка', 'error')
    } finally {
      setConfirmPromo(null)
    }
  }

  const columns = [
    { key: 'promotion_id', label: 'ID', sortable: true },
    { key: 'NAME', label: 'Название', sortable: true },
    {
      key: 'valid_from', label: 'Период',
      render: r => (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {r.valid_from ? formatDate(r.valid_from) : '—'} — {r.valid_to ? formatDate(r.valid_to) : '—'}
        </span>
      )
    },
    {
      key: 'status', label: 'Статус',
      render: r => {
        const s = getPromoStatus(r)
        return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: s.color + '22', color: s.color }}>{s.label}</span>
      }
    },
    {
      key: 'actions', label: 'Действия',
      render: r => (
        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => router.push(`/admin/promotions/${r.promotion_id}`)} style={actionBtn('var(--accent)')}>Товары</button>
          <button onClick={() => startEdit(r)} style={actionBtn('var(--info)')}>Изменить</button>
          <button onClick={() => setConfirmPromo(r)} style={actionBtn('var(--danger)')}>Удалить</button>
        </div>
      )
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Акции
        </h1>
        <Button variant="primary" size="sm" onClick={startAdd}>+ Новая акция</Button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)44', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontWeight: 700, marginBottom: 16 }}>
            {editId ? 'Редактировать акцию' : 'Новая акция'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Название *</label>
              <input value={form.NAME} onChange={e => setForm(f => ({ ...f, NAME: e.target.value }))} placeholder="Название акции" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Описание</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание акции" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Дата начала</label>
              <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Дата окончания</label>
              <input type="date" value={form.valid_to} onChange={e => setForm(f => ({ ...f, valid_to: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : editId ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelForm}>Отмена</Button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}><Skeleton height={300} borderRadius={8} /></div>
          : <DataTable columns={columns} data={promos} onRowClick={r => router.push(`/admin/promotions/${r.promotion_id}`)} emptyText="Нет акций" />
        }
      </div>

      <Modal isOpen={!!confirmPromo} onClose={() => setConfirmPromo(null)} title="Удалить акцию">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Удалить акцию «{confirmPromo?.NAME}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={handleDelete}>Удалить</Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmPromo(null)}>Отмена</Button>
        </div>
      </Modal>
    </div>
  )
}

function actionBtn(color) {
  return {
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

const labelStyle = { display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 14px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
}
