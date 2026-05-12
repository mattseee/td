import { create } from 'zustand'
import Cookies from 'js-cookie'

const COOKIE_NAME = 'auth_token'

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token, remember = false) => {
    const opts = remember ? { expires: 30 } : undefined
    Cookies.set(COOKIE_NAME, token, opts)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    Cookies.remove(COOKIE_NAME)
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  hydrate: async () => {
    const token = Cookies.get(COOKIE_NAME)
    if (!token) return
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('unauthorized')
      const data = await res.json()
      set({ user: data.data, token, isAuthenticated: true })
    } catch {
      Cookies.remove(COOKIE_NAME)
      set({ user: null, token: null, isAuthenticated: false })
    }
  },
}))

export default useAuthStore
export { COOKIE_NAME }
