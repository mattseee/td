'use client'
import { useState, useEffect } from 'react'
import api from '@/utils/api'
import { getImageUrl } from '@/utils/getImageUrl'

export default function TestImagesPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/products', { params: { limit: 5 } })
      .then(r => setProducts(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8, fontSize: 24, fontWeight: 700 }}>Диагностика изображений</h1>
      <div style={{ padding: '10px 16px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
        <strong>Инструкция:</strong> Откройте DevTools (F12) → вкладка Network → фильтр Img.<br />
        Найдите запросы на rkcdn.ru. Если статус <strong>403</strong> — hotlink protection, нужно скачать фото локально.<br />
        Если статус <strong>200</strong> — фото доступны, ищите другую причину.
      </div>

      {loading && <div style={{ color: '#888' }}>Загрузка...</div>}

      {products.map(p => (
        <div key={p.product_id} style={{ marginBottom: 32, padding: 20, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>#{p.product_id}</strong> — {p.NAME}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', wordBreak: 'break-all', marginBottom: 16, padding: '6px 10px', background: '#f9fafb', borderRadius: 6 }}>
            raw: {p.main_image || 'null'}<br />
            resolved: {getImageUrl(p.main_image)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: '#374151' }}>
                1. &lt;img&gt; через getImageUrl
              </div>
              <img
                src={getImageUrl(p.main_image)}
                alt={p.NAME}
                style={{ width: '100%', height: 150, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                onError={e => {
                  e.target.style.border = '2px solid red'
                  e.target.style.background = '#fef2f2'
                  e.target.alt = 'ОШИБКА ЗАГРУЗКИ'
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: '#374151' }}>
                2. &lt;img&gt; прямой URL из БД
              </div>
              <img
                src={p.main_image}
                alt={p.NAME}
                style={{ width: '100%', height: 150, objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
                onError={e => {
                  e.target.style.border = '2px solid red'
                  e.target.style.background = '#fef2f2'
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: '#374151' }}>
                3. Статус в DevTools
              </div>
              <div style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px dashed #d1d5db', fontSize: 12, color: '#6b7280', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                Откройте Network в DevTools и найдите этот URL
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
