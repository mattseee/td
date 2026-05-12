'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import Skeleton from '@/components/ui/Skeleton'

export default function AdminRoute({ children }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const addToast = useUiStore(s => s.addToast)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/admin')
      return
    }
    if (user?.role !== 'admin') {
      addToast('Доступ запрещён', 'error')
      router.replace('/')
    }
  }, [mounted, isAuthenticated, user, router, addToast])

  if (!mounted) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <Skeleton height={300} borderRadius={8} />
      </div>
    )
  }
  if (!isAuthenticated || user?.role !== 'admin') return null
  return children
}
