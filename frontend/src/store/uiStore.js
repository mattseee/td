import { create } from 'zustand'

let nextId = 0

const useUiStore = create((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = ++nextId
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), duration)
    return id
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  megaMenuOpen: false,
  setMegaMenuOpen: (v) => set({ megaMenuOpen: v }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),

  filterDrawerOpen: false,
  setFilterDrawerOpen: (v) => set({ filterDrawerOpen: v }),
}))

export default useUiStore
