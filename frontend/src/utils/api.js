import axios from 'axios'
import Cookies from 'js-cookie'
import { COOKIE_NAME } from '@/store/authStore'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const token = Cookies.get(COOKIE_NAME)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !error.config?.url?.includes('/api/auth/me')
    ) {
      Cookies.remove(COOKIE_NAME)
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
