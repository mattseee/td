import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existing = items.find(i => i.product_id === product.product_id)
        if (existing) {
          set({
            items: items.map(i =>
              i.product_id === product.product_id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                product_id:  product.product_id,
                name:        product.name || product.NAME,
                sku:         product.sku,
                image:       product.image || product.main_image || null,
                price:       product.price,
                quantity,
                branch_id:   product.branch_id || null,
                category_id: product.category_id || null,
              },
            ],
          })
        }
      },

      removeItem: (product_id) => {
        set({ items: get().items.filter(i => i.product_id !== product_id) })
      },

      updateQuantity: (product_id, quantity) => {
        if (quantity < 1) {
          set({ items: get().items.filter(i => i.product_id !== product_id) })
          return
        }
        set({
          items: get().items.map(i =>
            i.product_id === product_id ? { ...i, quantity } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'cart-store' }
  )
)

export default useCartStore
