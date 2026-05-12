'use client'
import AdminRoute from '@/components/auth/AdminRoute'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminRootLayout({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  )
}
