'use client'
import { useState } from 'react'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import useProjectsStore from '@/store/projectsStore'
import useUiStore from '@/store/uiStore'
import MaterialSlot from './MaterialSlot'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatPrice } from '@/utils/formatPrice'

export default function CalculatorResults({ materials }) {
  const [selectedProducts, setSelectedProducts] = useState({})
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [newProjectName, setNewProjectName] = useState('')

  const addItem = useCartStore(s => s.addItem)
  const addToast = useUiStore(s => s.addToast)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const projects = useProjectsStore(s => s.projects)
  const createProject = useProjectsStore(s => s.createProject)
  const addItemToProject = useProjectsStore(s => s.addItemToProject)

  const handleSelectProduct = (materialName, product) => {
    setSelectedProducts(prev => ({
      ...prev,
      [materialName]: product,
    }))
  }

  const handleAddToCart = () => {
    const materialKeys = Object.keys(selectedProducts)
    if (materialKeys.length === 0) {
      addToast('Сначала подберите товары для материалов', 'info')
      return
    }

    let added = 0
    materials.forEach(mat => {
      const product = selectedProducts[mat.name]
      if (!product || !product.price) return
      addItem({
        product_id:  product.product_id,
        name:        product.NAME,
        sku:         product.sku,
        image:       product.main_image,
        price:       product.price.finalPrice,
        category_id: product.category_id,
      }, Math.ceil(mat.quantity * (mat.unit === 'кг' || mat.unit === 'л' ? 0.05 : 1)))
      added++
    })

    if (added > 0) addToast(`Добавлено в корзину: ${added} позиций`, 'success')
    else addToast('Выберите товары с ценой для добавления в корзину', 'info')
  }

  const handleSaveToProject = () => {
    if (!isAuthenticated) {
      addToast('Войдите в аккаунт, чтобы сохранить в проект', 'info')
      return
    }
    setProjectModalOpen(true)
  }

  const handleConfirmSaveToProject = () => {
    let projectId = selectedProjectId
    if (projectId === 'new') {
      if (!newProjectName.trim()) {
        addToast('Введите название проекта', 'info')
        return
      }
      projectId = createProject({ name: newProjectName, type: 'repair', budget: 0 })
    }
    if (!projectId) {
      addToast('Выберите проект', 'info')
      return
    }

    materials.forEach(mat => {
      const product = selectedProducts[mat.name]
      if (!product) return
      addItemToProject(projectId, {
        product_id:       product.product_id,
        name:             product.NAME,
        image:            product.main_image,
        quantity_planned: Math.ceil(mat.quantity),
        price_fixed:      product.price?.finalPrice || 0,
      })
    })

    setProjectModalOpen(false)
    addToast('Материалы сохранены в проект', 'success')
  }

  const totalSelected = Object.values(selectedProducts).filter(p => p?.price).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          Список материалов
        </h3>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Нажмите «Подобрать товар» для каждой позиции
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {materials.map(mat => (
          <MaterialSlot
            key={mat.name}
            material={mat}
            onSelectProduct={handleSelectProduct}
          />
        ))}
      </div>

      {totalSelected > 0 && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '14px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Подобрано товаров: <strong style={{ color: 'var(--text)' }}>{totalSelected}</strong>
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
            {formatPrice(
              Object.values(selectedProducts)
                .filter(p => p?.price)
                .reduce((sum, p) => sum + p.price.finalPrice, 0)
            )}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button onClick={handleAddToCart} size="lg">
          🛒 Добавить выбранное в корзину
        </Button>
        <Button variant="secondary" onClick={handleSaveToProject} size="lg">
          📁 Сохранить в проект
        </Button>
      </div>

      {/* Modal: выбор проекта */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Сохранить в проект"
        maxWidth={420}
      >
        {projects.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Выберите проект
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            >
              <option value="">— Выбрать —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="new">+ Создать новый проект</option>
            </select>
          </div>
        )}

        {(projects.length === 0 || selectedProjectId === 'new') && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Название нового проекта
            </label>
            <input
              type="text"
              placeholder="Ремонт квартиры..."
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        <Button fullWidth onClick={handleConfirmSaveToProject}>Сохранить</Button>
      </Modal>
    </div>
  )
}
