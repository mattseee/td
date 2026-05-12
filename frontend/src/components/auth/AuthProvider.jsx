'use client'
import { useEffect } from 'react'
import useAuthStore from '@/store/authStore'

export default function AuthProvider({ children }) {
  const hydrate = useAuthStore(s => s.hydrate)

  useEffect(() => {
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return children
}
