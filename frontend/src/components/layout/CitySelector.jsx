'use client'
import { useEffect } from 'react'
import useCityStore from '@/store/cityStore'
import api from '@/utils/api'

// Единственный активный город — Санкт-Петербург
export default function CitySelector() {
  const { setCity } = useCityStore()

  useEffect(() => {
    api.get('/api/branches', { params: { city: 'Санкт-Петербург' } })
      .then(({ data }) => {
        const ids = (data.data || []).map(b => b.branch_id)
        setCity('Санкт-Петербург', ids)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
        Санкт-Петербург
      </span>
    </div>
  )
}
