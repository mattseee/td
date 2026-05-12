'use client'
import { useState, useEffect } from 'react'
import api from '@/utils/api'
import DataTable from '@/components/admin/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import useUiStore from '@/store/uiStore'

const emptyForm = { NAME: '', parent_id: '' }

export default function AdminCategoriesPage() {
  const addToast = useUiStore(s => s.addToast)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [confirmCat, setConfirmCat] = useState(null)

  function load() {
    setLoading(true)
    api.get('/api/admin/categories')
      .then(r => { if (r.data.success) setCategories(r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function startAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function startEdit(cat) {
    setForm({ NAME: cat.NAME, parent_id: cat.parent_id ?? '' })
    setEditId(cat.category_id)
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
      if (editId) {
        await api.put(`/api/admin/categories/${editId}`, { NAME: form.NAME.trim(), parent_id: form.parent_id || null })
        addToast('Категория обновлена', 'success')
      } else {
        await api.post('/api/admin/categories', { NAME: form.NAME.trim(), parent_id: form.parent_id || null })
        addToast('Категория создана', 'success')
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
    if (!confirmCat) return
    try {
      await api.delete(`/api/admin/categories/${confirmCat.category_id}`)
      addToast('Категория удалена', 'success')
      load()
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка удаления', 'error')
    } finally {
      setConfirmCat(null)
    }
  }

  const columns = [
    { key: 'category_id', label: 'ID', sortable: true },
    { key: 'NAME', label: 'Название', sortable: true },
    {
      key: 'parent_name', label: 'Родительская',
      render: r => r.parent_name || <span style={{ color: 'var(--text-muted)' }}>Корневая</span>
    },
    {
      key: 'actions', label: 'Действия',
      render: r => (
        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => startEdit(r)} style={actionBtn('var(--info)')}>Изменить</button>
          <button onClick={() => setConfirmCat(r)} style={actionBtn('var(--danger)')}>Удалить</button>
        </div>
      )
    },
  ]

  const parentOptions = categories.filter(c => c.category_id !== editId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Категории
        </h1>
        <Button variant="primary" size="sm" onClick={startAdd}>+ Новая категория</Button>
      </div>

      {/* Форма */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)44', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontWeight: 700, marginBottom: 16 }}>
            {editId ? 'Редактировать категорию' : 'Новая категория'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Название *</label>
              <input
                value={form.NAME}
                onChange={e => setForm(f => ({ ...f, NAME: e.target.value }))}
                placeholder="Название категории"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Родительская категория</label>
              <select
                value={form.parent_id}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— Корневая —</option>
                {parentOptions.map(c => <option key={c.category_id} value={c.category_id}>{c.NAME}</option>)}
              </select>
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
          : <DataTable columns={columns} data={categories} emptyText="Нет категорий" />
        }
      </div>

      <Modal isOpen={!!confirmCat} onClose={() => setConfirmCat(null)} title="Удалить категорию">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Удалить категорию «{confirmCat?.NAME}»? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={handleDelete}>Удалить</Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmCat(null)}>Отмена</Button>
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
