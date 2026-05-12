'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import useAuthStore from '@/store/authStore'
import Skeleton from '@/components/ui/Skeleton'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [mounted, isAuthenticated, pathname, router])

  if (!mounted) {
    return (
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
        <Skeleton height={300} borderRadius={8} />
      </div>
    )
  }
  if (!isAuthenticated) return null
  return children
}
