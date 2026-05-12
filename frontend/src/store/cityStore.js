import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCityStore = create(
  persist(
    (set) => ({
      city: null,
      branchIds: [],
      setCity: (city, branchIds) => set({ city, branchIds }),
      clearCity: () => set({ city: null, branchIds: [] }),
    }),
    { name: 'city-store' }
  )
)

export default useCityStore
