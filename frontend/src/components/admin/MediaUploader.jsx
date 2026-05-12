'use client'
import { useState, useRef } from 'react'
import api from '@/utils/api'
import { getImageUrl } from '@/utils/getImageUrl'
import useUiStore from '@/store/uiStore'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

export default function MediaUploader({ productId, media, onMediaChange }) {
  const addToast = useUiStore(s => s.addToast)
  const [urlInput, setUrlInput] = useState('')
  const [urlType, setUrlType] = useState('image')
  const [uploading, setUploading] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const fileRef = useRef(null)

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const res = await api.post(`/api/admin/products/${productId}/media`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        if (res.data.success) {
          onMediaChange(prev => [...prev, res.data.data])
          addToast('Фото загружено', 'success')
        }
      }
    } catch {
      addToast('Ошибка загрузки файла', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleAddUrl() {
    if (!urlInput.trim()) return
    try {
      const res = await api.post(`/api/admin/products/${productId}/media-url`, {
        url: urlInput.trim(), type: urlType
      })
      if (res.data.success) {
        onMediaChange(prev => [...prev, res.data.data])
        setUrlInput('')
        addToast('Медиа добавлено', 'success')
      }
    } catch {
      addToast('Ошибка добавления медиа', 'error')
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/api/admin/media/${confirmId}`)
      onMediaChange(prev => prev.filter(m => m.media_id !== confirmId))
      addToast('Медиа удалено', 'success')
    } catch {
      addToast('Ошибка удаления', 'error')
    } finally {
      setConfirmId(null)
    }
  }

  return (
    <div>
      {/* Список существующих медиа */}
      {media.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {media.map(m => (
            <div key={m.media_id} style={{
              position: 'relative', width: 100, height: 100,
              border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {(m.type === 'image' || !m.type) ? (
                <img
                  src={getImageUrl(m.url)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <span style={{ fontSize: 28 }}>{m.type === 'video' ? '🎥' : '📄'}</span>
              )}
              <button
                type="button"
                onClick={() => setConfirmId(m.media_id)}
                aria-label="Удалить медиафайл"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'var(--danger)', color: '#fff',
                  border: 'none', borderRadius: 4,
                  width: 22, height: 22, fontSize: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Загрузка файлов */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
          Загрузить файлы (jpg, png, webp, gif — до 10 МБ)
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="media-file-input"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Загрузка...' : '📁 Выбрать файлы'}
          </Button>
        </div>
      </div>

      {/* Добавить по ссылке */}
      <div>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
          Добавить по ссылке
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://..."
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          />
          <select value={urlType} onChange={e => setUrlType(e.target.value)} style={inputStyle}>
            <option value="image">Фото</option>
            <option value="video">Видео</option>
            <option value="doc">Документ</option>
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddUrl}>
            Добавить
          </Button>
        </div>
      </div>
      <Modal isOpen={confirmId !== null} onClose={() => setConfirmId(null)} title="Удалить медиафайл">
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Удалить медиафайл? Это действие нельзя отменить.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="danger" fullWidth onClick={confirmDelete}>Удалить</Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirmId(null)}>Отмена</Button>
        </div>
      </Modal>
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 14,
}
