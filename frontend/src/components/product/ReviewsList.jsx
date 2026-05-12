'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import RatingStars from '@/components/ui/RatingStars'
import Button from '@/components/ui/Button'
import { formatDate } from '@/utils/formatDate'
import useUiStore from '@/store/uiStore'
import Skeleton from '@/components/ui/Skeleton'

export default function ReviewsList({ productId }) {
  const [sort, setSort] = useState('newest')
  const [filterStar, setFilterStar] = useState(0)
  const [form, setForm] = useState({ user_name: '', rating: 5, COMMENT: '' })
  const [showForm, setShowForm] = useState(false)
  const addToast = useUiStore(s => s.addToast)
  const qc = useQueryClient()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId, sort],
    queryFn: () => api.get(`/api/products/${productId}/reviews`, { params: { sort } }).then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (body) => api.post(`/api/products/${productId}/reviews`, body),
    onSuccess: () => {
      addToast('Отзыв добавлен, спасибо!', 'success')
      setForm({ user_name: '', rating: 5, COMMENT: '' })
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['reviews', productId] })
      qc.invalidateQueries({ queryKey: ['product', productId] })
    },
    onError: (e) => addToast(e.response?.data?.error || 'Ошибка при добавлении', 'error'),
  })

  const filtered = filterStar > 0 ? reviews.filter(r => r.rating === filterStar) : reviews
  const histogram = [5, 4, 3, 2, 1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }))
  const avgRating = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.user_name.trim()) return addToast('Укажите ваше имя', 'error')
    mutation.mutate(form)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
            <RatingStars value={avgRating} size={20} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{reviews.length} отзывов</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {histogram.map(h => (
              <button key={h.star} onClick={() => setFilterStar(filterStar === h.star ? 0 : h.star)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
                <span style={{ fontSize: 12, color: filterStar === h.star ? 'var(--accent)' : 'var(--text-muted)', minWidth: 10 }}>{h.star}★</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${reviews.length ? (h.count / reviews.length) * 100 : 0}%`, height: '100%', background: filterStar === h.star ? 'var(--accent)' : 'var(--text-muted)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 16 }}>{h.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort + add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['newest', 'Сначала новые'], ['rating_high', 'По оценке']].map(([val, label]) => (
            <button key={val} onClick={() => setSort(val)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
              background: sort === val ? 'var(--surface-2)' : 'none',
              border: `1px solid ${sort === val ? 'var(--accent)' : 'var(--border)'}`,
              color: sort === val ? 'var(--accent)' : 'var(--text-muted)',
            }}>{label}</button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}>
          Написать отзыв
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Ваш отзыв</div>
          <input
            placeholder="Ваше имя *"
            value={form.user_name}
            onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Оценка:</span>
            <RatingStars value={form.rating} interactive onChange={v => setForm(f => ({ ...f, rating: v }))} size={24} />
          </div>
          <textarea
            placeholder="Расскажите о товаре..."
            value={form.COMMENT}
            onChange={e => setForm(f => ({ ...f, COMMENT: e.target.value }))}
            rows={3}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" disabled={mutation.isPending} size="sm">
              {mutation.isPending ? 'Отправка...' : 'Отправить'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Отмена</Button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {isLoading && [1,2,3].map(i => <Skeleton key={i} height={80} />)}
      {!isLoading && filtered.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          {reviews.length === 0 ? 'Пока нет отзывов. Будьте первым!' : 'Нет отзывов с такой оценкой'}
        </div>
      )}
      {filtered.map(review => (
        <div key={review.review_id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{review.user_name}</span>
              <RatingStars value={review.rating} size={14} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(review.created_at)}</span>
          </div>
          {review.COMMENT && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{review.COMMENT}</p>}
        </div>
      ))}
    </div>
  )
}
