'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import DataTable from '@/components/admin/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import useUiStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDate } from '@/utils/formatDate'

export default function AdminUsersPage() {
  const addToast = useUiStore(s => s.addToast)
  const currentUser = useAuthStore(s => s.user)

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [changingRole, setChangingRole] = useState({})
  const debouncedSearch = useDebounce(search, 400)
  const LIMIT = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: LIMIT }
    if (debouncedSearch) params.q = debouncedSearch
    api.get('/api/admin/users', { params })
      .then(r => { if (r.data.success) { setUsers(r.data.data); setTotal(r.data.total) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  async function handleRoleChange(user, role) {
    if (changingRole[user.user_id]) return
    setChangingRole(prev => ({ ...prev, [user.user_id]: true }))
    try {
      const res = await api.put(`/api/admin/users/${user.user_id}/role`, { role })
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, role } : u))
        addToast(`Роль ${user.email} изменена на ${role}`, 'success')
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Ошибка изменения роли', 'error')
    } finally {
      setChangingRole(prev => ({ ...prev, [user.user_id]: false }))
    }
  }

  const columns = [
    { key: 'user_id', label: 'ID', sortable: true },
    {
      key: 'email', label: 'Email',
      render: r => <span style={{ fontWeight: 500 }}>{r.email}</span>
    },
    { key: 'name', label: 'Имя', render: r => r.name || <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'phone', label: 'Телефон', render: r => r.phone || <span style={{ color: 'var(--text-muted)' }}>—</span> },
    {
      key: 'role', label: 'Роль',
      render: r => (
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12,
          background: r.role === 'admin' ? 'var(--accent)22' : 'var(--border)',
          color: r.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {r.role === 'admin' ? 'Администратор' : 'Пользователь'}
        </span>
      )
    },
    { key: 'created_at', label: 'Регистрация', sortable: true, render: r => formatDate(r.created_at) },
    {
      key: 'actions', label: 'Действия',
      render: r => {
        const isSelf = currentUser?.user_id === r.user_id
        return (
          <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
            {r.role !== 'admin' && (
              <button
                disabled={changingRole[r.user_id]}
                onClick={() => handleRoleChange(r, 'admin')}
                style={roleBtn('var(--accent)')}
              >
                → Admin
              </button>
            )}
            {r.role === 'admin' && !isSelf && (
              <button
                disabled={changingRole[r.user_id]}
                onClick={() => handleRoleChange(r, 'user')}
                style={roleBtn('var(--text-muted)')}
              >
                → User
              </button>
            )}
            {r.role === 'admin' && isSelf && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Вы</span>
            )}
          </div>
        )
      }
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
        Пользователи
      </h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по email или имени..."
          style={inputStyle}
        />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 24 }}><Skeleton height={300} borderRadius={8} /></div>
          : <DataTable columns={columns} data={users} emptyText="Пользователи не найдены" />
        }
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
      </div>
    </div>
  )
}

function roleBtn(color) {
  return {
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

const inputStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 14px',
  color: 'var(--text)',
  fontSize: 14,
  minWidth: 300,
}
