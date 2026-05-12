import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useProjectsStore = create(
  persist(
    (set, get) => ({
      projects: [],

      createProject: (data) => {
        const id = crypto.randomUUID()
        const shareToken = crypto.randomUUID()
        const project = {
          id,
          name: data.name,
          type: data.type || 'repair',
          budget: parseFloat(data.budget) || 0,
          items: [],
          shareToken,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ projects: [project, ...s.projects] }))
        return id
      },

      updateProject: (id, patch) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === id ? { ...p, ...patch } : p
          ),
        }))
      },

      deleteProject: (id) => {
        set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
      },

      addItemToProject: (projectId, item) => {
        set(s => ({
          projects: s.projects.map(p => {
            if (p.id !== projectId) return p
            const existing = p.items.find(i => i.product_id === item.product_id)
            if (existing) {
              return {
                ...p,
                items: p.items.map(i =>
                  i.product_id === item.product_id
                    ? { ...i, quantity_planned: i.quantity_planned + (item.quantity_planned || 1) }
                    : i
                ),
              }
            }
            return {
              ...p,
              items: [
                ...p.items,
                {
                  product_id: item.product_id,
                  name: item.name,
                  image: item.image || null,
                  quantity_planned: item.quantity_planned || 1,
                  quantity_bought: 0,
                  price_fixed: item.price_fixed || 0,
                  status: 'planned',
                },
              ],
            }
          }),
        }))
      },

      updateItemStatus: (projectId, productId, status) => {
        set(s => ({
          projects: s.projects.map(p => {
            if (p.id !== projectId) return p
            return {
              ...p,
              items: p.items.map(i =>
                i.product_id === productId ? { ...i, status } : i
              ),
            }
          }),
        }))
      },

      updateItemQuantity: (projectId, productId, field, value) => {
        set(s => ({
          projects: s.projects.map(p => {
            if (p.id !== projectId) return p
            return {
              ...p,
              items: p.items.map(i =>
                i.product_id === productId ? { ...i, [field]: value } : i
              ),
            }
          }),
        }))
      },

      removeItemFromProject: (projectId, productId) => {
        set(s => ({
          projects: s.projects.map(p => {
            if (p.id !== projectId) return p
            return { ...p, items: p.items.filter(i => i.product_id !== productId) }
          }),
        }))
      },

      getByShareToken: (token) => {
        return get().projects.find(p => p.shareToken === token) || null
      },
    }),
    { name: 'projects-store' }
  )
)

export default useProjectsStore
