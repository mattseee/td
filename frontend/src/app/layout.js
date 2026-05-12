import { Inter } from 'next/font/google'
import QueryProvider from '@/components/QueryProvider'
import AuthProvider from '@/components/auth/AuthProvider'
import LayoutShell from '@/components/layout/LayoutShell'
import ToastContainer from '@/components/ui/Toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'ТД Сток — строительный маркетплейс',
  description: 'Торговый Дом Сток — профессиональный строительный маркетплейс',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <QueryProvider>
          <AuthProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
            <ToastContainer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
