'use client'
import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>
        Новый товар
      </h1>
      <ProductForm />
    </div>
  )
}
