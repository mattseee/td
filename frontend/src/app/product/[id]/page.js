'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Heart, FolderPlus, BarChart2, Share2, Copy } from 'lucide-react'
import api from '@/utils/api'
import useCityStore from '@/store/cityStore'
import useUiStore from '@/store/uiStore'
import ProductGallery from '@/components/product/ProductGallery'
import PriceBlock from '@/components/product/PriceBlock'
import StockBadge from '@/components/product/StockBadge'
import SpecsTable from '@/components/product/SpecsTable'
import ReviewsList from '@/components/product/ReviewsList'
import RelatedProducts from '@/components/product/RelatedProducts'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Stepper from '@/components/ui/Stepper'
import RatingStars from '@/components/ui/RatingStars'
import Skeleton from '@/components/ui/Skeleton'
import { formatPrice } from '@/utils/formatPrice'
import { getEffectivePrice } from '@/utils/pricing'
import useCartStore from '@/store/cartStore'
import useFavoritesStore from '@/store/favoritesStore'
import useAuthStore from '@/store/authStore'
import useProjectsStore from '@/store/projectsStore'
import { decodeEntities } from '@/utils/decodeEntities'

const TABS = ['Описание', 'Характеристики', 'Документы', 'Отзывы', 'Доставка']

export default function ProductPage() {
  const { id } = useParams()
  const { city, branchIds } = useCityStore()
  const addToast  = useUiStore(s => s.addToast)
  const addItem   = useCartStore(s => s.addItem)
  const toggleFav = useFavoritesStore(s => s.toggle)
  const isFav     = useFavoritesStore(s => id ? s.productIds.includes(parseInt(id)) : false)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const projects = useProjectsStore(s => s.projects)
  const addItemToProject = useProjectsStore(s => s.addItemToProject)
  const createProject = useProjectsStore(s => s.createProject)

  const [activeTab, setActiveTab] = useState(0)
  const [qty, setQty] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!projectDropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [projectDropdownOpen])

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/api/products/${id}`).then(r => r.data.data),
    enabled: !!id,
  })

  const product = productData

  const effectivePrice = (() => {
    if (!mounted || !product?.prices) return null
    const bids = branchIds?.length > 0 ? branchIds : (product.prices[0]?.branch_id ? [product.prices[0].branch_id] : [])
    const promotions = (product.promotions || [])
    const promoRows = (product.promoRows || [])
    for (const bid of bids) {
      const p = getEffectivePrice(product.prices, promoRows, promotions, bid)
      if (p) return p
    }
    return product.prices[0] ? getEffectivePrice(product.prices, promoRows, promotions, product.prices[0].branch_id) : null
  })()

  const copySkU = () => {
    navigator.clipboard.writeText(product.sku).then(() => addToast(`SKU ${product.sku} скопирован`, 'success'))
  }

  const handleAddToProject = (projectId) => {
    setProjectDropdownOpen(false)
    const proj = projects.find(p => p.id === projectId)
    addItemToProject(projectId, {
      product_id:       parseInt(id),
      name:             product.NAME,
      image:            product.media?.find(m => m.TYPE === 'image')?.url || null,
      quantity_planned: qty,
      price_fixed:      effectivePrice?.finalPrice || 0,
    })
    addToast(`Добавлено в проект «${proj?.name}»`, 'success')
  }

  const handleAddToNewProject = () => {
    setProjectDropdownOpen(false)
    const newId = createProject({ name: `Проект ${new Date().toLocaleDateString('ru-RU')}`, type: 'repair', budget: 0 })
    addItemToProject(newId, {
      product_id:       parseInt(id),
      name:             product.NAME,
      image:            product.media?.find(m => m.TYPE === 'image')?.url || null,
      quantity_planned: qty,
      price_fixed:      effectivePrice?.finalPrice || 0,
    })
    addToast('Создан новый проект и товар добавлен', 'success')
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1536, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <Skeleton height={480} borderRadius={8} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton height={24} width="40%" />
            <Skeleton height={36} />
            <Skeleton height={36} width="80%" />
            <Skeleton height={20} width="30%" />
            <Skeleton height={40} width="50%" style={{ marginTop: 16 }} />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 1536, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Товар не найден</h2>
        <Link href="/catalog"><Button>В каталог</Button></Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1536, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Breadcrumbs */}
      <nav style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Главная</Link>
        <span>/</span>
        <Link href="/catalog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Каталог</Link>
        {product.category_slug && <>
          <span>/</span>
          <Link href={`/catalog/${product.category_slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{product.category_name}</Link>
        </>}
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{product.NAME}</span>
      </nav>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48 }} className="product-grid">

        {/* Left: Gallery */}
        <div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start', padding: 12 }}>
              {product.is_exclusive === 1 && <Badge variant="exclusive">Эксклюзив</Badge>}
              {effectivePrice?.priceType === 'promo' && <Badge variant="promo">Акция</Badge>}
              {effectivePrice?.discountPercent > 0 && <Badge variant="discount">−{effectivePrice.discountPercent}%</Badge>}
            </div>
            <ProductGallery media={product.media || []} />
          </div>
        </div>

        {/* Right: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Brand */}
          <Link href={`/brands/${product.brand_id}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {product.brand_name}
          </Link>

          {/* Name */}
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>
            {product.NAME}
          </h1>

          {/* SKU */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Арт.:</span>
            <span style={{ fontSize: 12, fontFamily: 'inherit', color: 'var(--text)' }}>{product.sku}</span>
            <button
              onClick={copySkU}
              title="Скопировать SKU"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                borderRadius: 4, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Copy size={14} />
            </button>
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RatingStars value={product.avg_rating} size={18} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {product.avg_rating > 0 ? `${parseFloat(product.avg_rating).toFixed(1)} · ` : ''}{product.review_count} {pluralReviews(product.review_count)}
            </span>
          </div>

          {/* Price */}
          <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <PriceBlock price={effectivePrice} size="lg" />
          </div>

          {/* Stock */}
          <StockBadge stock={product.stock || []} city={mounted ? city : null} />

          {/* Add to cart */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stepper value={qty} min={1} max={999} onChange={setQty} />
            <Button size="lg" onClick={() => {
              if (!effectivePrice) {
                addToast('Выберите город для добавления в корзину', 'info')
                return
              }
              addItem({
                product_id:  product.product_id,
                name:        product.NAME,
                sku:         product.sku,
                image:       product.media?.find(m => m.TYPE === 'image')?.url || null,
                price:       effectivePrice.finalPrice,
                branch_id:   branchIds?.[0] || null,
                category_id: product.category_id || null,
              }, qty)
              addToast(`${product.NAME} добавлен в корзину (${qty} шт.)`, 'success')
            }} style={{ flex: 1 }}>
              В корзину
            </Button>
          </div>

          {/* Action buttons — horizontal row */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', paddingTop: 4 }}>
            {/* Favorites */}
            <button
              onClick={() => {
                toggleFav(product.product_id)
                addToast(isFav ? 'Убрано из избранного' : 'Добавлено в избранное', 'success')
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                color: isFav ? 'var(--danger)' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 500, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!isFav) e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = isFav ? 'var(--danger)' : 'var(--text-muted)' }}
            >
              <Heart size={18} fill={isFav ? 'var(--danger)' : 'none'} color={isFav ? 'var(--danger)' : 'currentColor'} />
              {isFav ? 'В избранном' : 'В избранное'}
            </button>

            {/* + В проект */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    addToast('Войдите, чтобы добавить в проект', 'info')
                    return
                  }
                  setProjectDropdownOpen(o => !o)
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <FolderPlus size={18} />
                + В проект
              </button>

              {/* Dropdown */}
              {projectDropdownOpen && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0,
                  marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  zIndex: 100, overflow: 'hidden', minWidth: 200,
                }}>
                  {projects.length === 0 ? (
                    <button
                      onClick={handleAddToNewProject}
                      style={{
                        width: '100%', background: 'none', border: 'none', padding: '12px 16px',
                        cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                        textAlign: 'left', display: 'block',
                      }}
                    >
                      + Создать проект и добавить
                    </button>
                  ) : (
                    <>
                      <div style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Выберите проект
                      </div>
                      {projects.map(proj => (
                        <button
                          key={proj.id}
                          onClick={() => handleAddToProject(proj.id)}
                          style={{
                            width: '100%', background: 'none', border: 'none', padding: '10px 16px',
                            cursor: 'pointer', color: 'var(--text)', fontSize: 13,
                            textAlign: 'left', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                        >
                          {proj.name}
                        </button>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={handleAddToNewProject}
                          style={{
                            width: '100%', background: 'none', border: 'none', padding: '10px 16px',
                            cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                            textAlign: 'left',
                          }}
                        >
                          + Новый проект
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Сравнить */}
            <button
              onClick={() => addToast('Сравнить — скоро!', 'info')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <BarChart2 size={18} />
              Сравнить
            </button>

            {/* Поделиться */}
            <button
              onClick={() => addToast('Поделиться — скоро!', 'info')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Share2 size={18} />
              Поделиться
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto', gap: 0, marginBottom: 24 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === i ? 'var(--accent)' : 'transparent'}`,
              color: activeTab === i ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 14, fontWeight: activeTab === i ? 600 : 400,
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              marginBottom: -1,
            }}>{tab}</button>
          ))}
        </div>

        <div>
          {activeTab === 0 && (
            <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.8, maxWidth: 720, whiteSpace: 'pre-line' }}>
              {product.description
                ? decodeEntities(product.description)
                : <span style={{ color: 'var(--text-muted)' }}>Описание не указано</span>}
            </div>
          )}

          {activeTab === 1 && (
            <SpecsTable product={product} specifications={product.specifications || []} />
          )}

          {activeTab === 2 && (
            <div>
              {(!product.documents?.length && !product.media?.filter(m => m.TYPE === 'doc').length) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Документы не добавлены</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {product.documents?.map(doc => (
                    <a key={doc.document_id} href={doc.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', background: 'var(--surface-2)',
                      borderRadius: 8, textDecoration: 'none', color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{doc.TYPE}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.url.split('/').pop()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 3 && <ReviewsList productId={id} />}

          {activeTab === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Наличие в магазинах:</p>
              {(product.stock || []).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Нет данных о наличии</div>
              ) : (
                product.stock.map(s => (
                  <div key={s.stock_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.branch_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.city} · {s.address}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.contact_info}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.quantity > 0 ? (s.quantity <= 5 ? 'var(--accent)' : 'var(--success)') : 'var(--danger)', whiteSpace: 'nowrap', marginLeft: 16 }}>
                      {s.quantity > 0 ? (s.quantity <= 5 ? `${s.quantity} шт` : 'В наличии') : 'Нет'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related & Analogs */}
      <RelatedProducts productId={id} relationType="сопутствующий" title="Сопутствующие товары" />
      <RelatedProducts productId={id} relationType="аналог" title="Похожие товары (аналоги)" />

      {/* Mobile sticky add-to-cart bar */}
      {mounted && (
        <div className="product-mobile-cta" style={{
          position: 'fixed', bottom: 56, left: 0, right: 0, zIndex: 400,
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          padding: '10px 16px', display: 'none',
          gap: 10, alignItems: 'center',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.NAME}
            </div>
            {effectivePrice && (
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'inherit', color: 'var(--accent)' }}>
                {formatPrice(effectivePrice.finalPrice)}
              </div>
            )}
          </div>
          <Button size="md" onClick={() => {
            if (!effectivePrice) { addToast('Выберите город', 'info'); return }
            addItem({
              product_id:  product.product_id,
              name:        product.NAME,
              sku:         product.sku,
              image:       product.media?.find(m => m.TYPE === 'image')?.url || null,
              price:       effectivePrice.finalPrice,
              branch_id:   branchIds?.[0] || null,
              category_id: product.category_id || null,
            }, qty)
            addToast(`${product.NAME} добавлен в корзину`, 'success')
          }}>В корзину</Button>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .product-grid { grid-template-columns: 1fr !important; }
          .product-mobile-cta { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function pluralReviews(n) {
  if (n % 100 >= 11 && n % 100 <= 19) return 'отзывов'
  const r = n % 10
  if (r === 1) return 'отзыв'
  if (r >= 2 && r <= 4) return 'отзыва'
  return 'отзывов'
}
