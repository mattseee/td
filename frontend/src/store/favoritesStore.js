import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useFavoritesStore = create(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (product_id) => {
        const { productIds } = get()
        if (productIds.includes(product_id)) {
          set({ productIds: productIds.filter(id => id !== product_id) })
        } else {
          set({ productIds: [...productIds, product_id] })
        }
      },

      isFavorite: (product_id) => get().productIds.includes(product_id),

      clear: () => set({ productIds: [] }),
    }),
    { name: 'favorites-store' }
  )
)

export default useFavoritesStore
