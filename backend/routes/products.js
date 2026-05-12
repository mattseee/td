const express = require('express')
const router = express.Router()
const pool = require('../db')
const { resolveImageUrl } = require('../utils/getImageUrl')
const { getEffectivePrice } = require('../utils/pricing')

async function getCategoryDescendants(parentId) {
  const [all] = await pool.query('SELECT category_id, parent_id FROM categories')
  const result = []
  const collect = (id) => {
    result.push(id)
    all.filter(c => c.parent_id === id).forEach(c => collect(c.category_id))
  }
  collect(parentId)
  return result
}

async function enrichWithPrices(rows, branchIds) {
  if (!rows.length) return rows
  const ids = rows.map(r => r.product_id)
  const placeholders = ids.map(() => '?').join(',')

  const [prices] = await pool.query(
    `SELECT * FROM prices WHERE product_id IN (${placeholders}) AND CURDATE() BETWEEN valid_from AND valid_to`,
    ids
  )
  const [promoRows] = await pool.query(`
    SELECT pp.product_id, pp.promo_price, pp.promotion_id,
      pr.NAME as promo_name, pr.valid_from, pr.valid_to
    FROM productpromotions pp
    JOIN promotions pr ON pp.promotion_id = pr.promotion_id
    WHERE pp.product_id IN (${placeholders}) AND CURDATE() BETWEEN pr.valid_from AND pr.valid_to
  `, ids)

  return rows.map(product => {
    const productPrices = prices.filter(p => p.product_id === product.product_id)
    const productPromos = promoRows.filter(p => p.product_id === product.product_id)
    const promotions = productPromos.map(p => ({
      promotion_id: p.promotion_id,
      NAME: p.promo_name,
      valid_from: p.valid_from,
      valid_to: p.valid_to,
    }))

    let effectivePrice = null
    if (branchIds.length > 0) {
      for (const bid of branchIds) {
        effectivePrice = getEffectivePrice(productPrices, productPromos, promotions, bid)
        if (effectivePrice) break
      }
    } else if (productPrices.length > 0) {
      const firstBid = productPrices[0].branch_id
      effectivePrice = getEffectivePrice(productPrices, productPromos, promotions, firstBid)
    }

    return { ...product, main_image: resolveImageUrl(product.main_image), price: effectivePrice }
  })
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const {
      category_id, brand_id, brand_ids, supplier_id, branch_id, city,
      in_stock, is_exclusive, price_min, price_max,
      power_cold_min, power_cold_max, power_heat_min, power_heat_max,
      air_flow_min, air_flow_max,
      sort = 'newest', page = 1, limit = 12, q, ids,
    } = req.query

    let branchIds = []
    if (branch_id) {
      branchIds = [parseInt(branch_id)]
    } else if (city) {
      const [br] = await pool.query('SELECT branch_id FROM branches WHERE city = ?', [city])
      branchIds = br.map(b => b.branch_id)
    }

    const conditions = ['1=1']
    const params = []

    // Batch fetch by ids: ?ids=1,2,3
    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean)
      if (idList.length === 0) return res.json({ success: true, data: [], total: 0, page: 1 })
      conditions.push(`p.product_id IN (${idList.map(() => '?').join(',')})`)
      params.push(...idList)
    }

    if (category_id) {
      const catIds = await getCategoryDescendants(parseInt(category_id))
      conditions.push(`p.category_id IN (${catIds.map(() => '?').join(',')})`)
      params.push(...catIds)
    }

    // Multi-brand support: brand_ids=1,2,3 takes priority over brand_id
    const brandIdList = brand_ids
      ? brand_ids.split(',').map(Number).filter(Boolean)
      : brand_id ? [parseInt(brand_id)] : []
    if (brandIdList.length > 0) {
      conditions.push(`p.brand_id IN (${brandIdList.map(() => '?').join(',')})`)
      params.push(...brandIdList)
    }

    if (supplier_id) { conditions.push('p.supplier_id = ?'); params.push(parseInt(supplier_id)) }
    if (is_exclusive === '1' || is_exclusive === 'true') conditions.push('p.is_exclusive = 1')
    if (q) {
      conditions.push('(p.NAME LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)')
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }
    if (in_stock === '1' || in_stock === 'true') {
      if (branchIds.length > 0) {
        conditions.push(`EXISTS (SELECT 1 FROM stock st WHERE st.product_id = p.product_id AND st.branch_id IN (${branchIds.map(() => '?').join(',')}) AND st.quantity > 0)`)
        params.push(...branchIds)
      } else {
        conditions.push('EXISTS (SELECT 1 FROM stock st2 WHERE st2.product_id = p.product_id AND st2.quantity > 0)')
      }
    }

    // Climate filters
    if (power_cold_min) { conditions.push('p.power_cold >= ?'); params.push(parseFloat(power_cold_min)) }
    if (power_cold_max) { conditions.push('p.power_cold <= ?'); params.push(parseFloat(power_cold_max)) }
    if (power_heat_min) { conditions.push('p.power_heat >= ?'); params.push(parseFloat(power_heat_min)) }
    if (power_heat_max) { conditions.push('p.power_heat <= ?'); params.push(parseFloat(power_heat_max)) }
    if (air_flow_min)   { conditions.push('p.air_flow >= ?'); params.push(parseFloat(air_flow_min)) }
    if (air_flow_max)   { conditions.push('p.air_flow <= ?'); params.push(parseFloat(air_flow_max)) }

    // Dynamic spec filters: params like spec_Толщина=12.5
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('spec_')) {
        const specName = key.slice(5)
        conditions.push('EXISTS (SELECT 1 FROM productspecifications ps WHERE ps.product_id = p.product_id AND ps.NAME = ? AND ps.VALUE = ?)')
        params.push(specName, req.query[key])
      }
    })

    const sqlSort = sort === 'rating' ? 'avg_rating DESC, p.product_id DESC' : 'p.product_id DESC'
    const whereClause = 'WHERE ' + conditions.join(' AND ')

    const [rows] = await pool.query(`
      SELECT
        p.product_id, p.sku, p.NAME, p.is_exclusive,
        p.category_id, p.brand_id, p.supplier_id,
        p.weight, p.power_cold, p.power_heat, p.air_flow,
        b.NAME as brand_name,
        c.NAME as category_name, c.slug as category_slug,
        ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count,
        (SELECT pm2.url FROM productmedia pm2
         WHERE pm2.product_id = p.product_id AND pm2.TYPE = 'image'
         ORDER BY pm2.media_id ASC LIMIT 1) as main_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      ${whereClause}
      GROUP BY p.product_id, b.NAME, c.NAME, c.slug
      ORDER BY ${sqlSort}
    `, params)

    let products = await enrichWithPrices(rows, branchIds)

    if (price_min) products = products.filter(p => p.price && p.price.finalPrice >= parseFloat(price_min))
    if (price_max) products = products.filter(p => p.price && p.price.finalPrice <= parseFloat(price_max))
    if (sort === 'price_asc') products.sort((a, b) => (a.price?.finalPrice ?? Infinity) - (b.price?.finalPrice ?? Infinity))
    if (sort === 'price_desc') products.sort((a, b) => (b.price?.finalPrice ?? -Infinity) - (a.price?.finalPrice ?? -Infinity))

    const total = products.length
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12))
    const paged = products.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    res.json({ success: true, data: paged, total, page: pageNum })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const [products] = await pool.query(`
      SELECT p.*,
        b.NAME as brand_name, b.brand_id,
        c.NAME as category_name, c.slug as category_slug, c.parent_id as category_parent_id,
        s.NAME as supplier_name,
        ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.product_id = ?
      GROUP BY p.product_id, b.NAME, b.brand_id, c.NAME, c.slug, c.parent_id, s.NAME
    `, [id])

    if (!products.length) return res.status(404).json({ success: false, error: 'Товар не найден' })
    const product = products[0]

    const [[media], [specs], [docs], [prices], [stock], [promoRows]] = await Promise.all([
      pool.query('SELECT * FROM productmedia WHERE product_id = ? ORDER BY media_id', [id]),
      pool.query('SELECT * FROM productspecifications WHERE product_id = ? ORDER BY spec_id', [id]),
      pool.query('SELECT * FROM documents WHERE product_id = ? ORDER BY document_id', [id]),
      pool.query(`SELECT pr.*, b.NAME as branch_name, b.city, b.address
        FROM prices pr LEFT JOIN branches b ON pr.branch_id = b.branch_id
        WHERE pr.product_id = ? AND CURDATE() BETWEEN pr.valid_from AND pr.valid_to ORDER BY b.city`, [id]),
      pool.query(`SELECT s.*, b.NAME as branch_name, b.city, b.address, b.contact_info
        FROM stock s LEFT JOIN branches b ON s.branch_id = b.branch_id
        WHERE s.product_id = ? ORDER BY b.city`, [id]),
      pool.query(`SELECT pp.product_id, pp.promo_price, pp.promotion_id,
        pr.NAME as promo_name, pr.valid_from, pr.valid_to
        FROM productpromotions pp JOIN promotions pr ON pp.promotion_id = pr.promotion_id
        WHERE pp.product_id = ? AND CURDATE() BETWEEN pr.valid_from AND pr.valid_to`, [id]),
    ])

    const promotions = promoRows.map(p => ({
      promotion_id: p.promotion_id,
      NAME: p.promo_name,
      valid_from: p.valid_from,
      valid_to: p.valid_to,
    }))

    res.json({
      success: true,
      data: {
        ...product,
        media: media.map(m => ({ ...m, url: resolveImageUrl(m.url) })),
        specifications: specs,
        documents: docs,
        prices,
        stock,
        promotions,
        promoRows,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/products/:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { type = 'all', branch_id, city } = req.query

    let branchIds = []
    if (branch_id) branchIds = [parseInt(branch_id)]
    else if (city) {
      const [br] = await pool.query('SELECT branch_id FROM branches WHERE city = ?', [city])
      branchIds = br.map(b => b.branch_id)
    }

    let typeFilter = ''
    if (type !== 'all') typeFilter = 'AND rp.relation_type = ?'
    const params = type !== 'all' ? [id, type] : [id]

    const [rows] = await pool.query(`
      SELECT p.product_id, p.sku, p.NAME, p.is_exclusive,
        p.category_id, p.brand_id,
        b.NAME as brand_name,
        c.NAME as category_name, c.slug as category_slug,
        ROUND(COALESCE(AVG(r.rating), 0), 1) as avg_rating,
        COUNT(DISTINCT r.review_id) as review_count,
        rp.relation_type,
        (SELECT pm2.url FROM productmedia pm2 WHERE pm2.product_id = p.product_id AND pm2.TYPE = 'image' ORDER BY pm2.media_id LIMIT 1) as main_image
      FROM relatedproducts rp
      JOIN products p ON rp.related_id = p.product_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE rp.product_id = ? ${typeFilter}
      GROUP BY p.product_id, b.NAME, c.NAME, c.slug, rp.relation_type
    `, params)

    const enriched = await enrichWithPrices(rows, branchIds)
    res.json({ success: true, data: enriched })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { sort = 'newest' } = req.query
    const orderBy = sort === 'rating_high' ? 'rating DESC, created_at DESC' : 'created_at DESC'
    const [rows] = await pool.query(
      `SELECT * FROM reviews WHERE product_id = ? ORDER BY ${orderBy}`, [id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// POST /api/products/:id/reviews
const { optionalAuthMiddleware } = require('../middleware/auth')
router.post('/:id/reviews', optionalAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { rating, COMMENT } = req.body

    // If authenticated — take name from DB, ignore form field
    let user_name = req.body.user_name
    if (req.user) {
      const [rows] = await pool.query('SELECT name, email FROM users WHERE user_id = ?', [req.user.user_id])
      user_name = rows[0]?.name || rows[0]?.email || 'Пользователь'
    }

    if (!user_name || !user_name.trim()) return res.status(400).json({ success: false, error: 'Укажите ваше имя' })
    const r = parseInt(rating)
    if (!r || r < 1 || r > 5) return res.status(400).json({ success: false, error: 'Оценка должна быть от 1 до 5' })

    const [result] = await pool.query(
      'INSERT INTO reviews (product_id, user_name, rating, COMMENT) VALUES (?, ?, ?, ?)',
      [id, user_name.trim(), r, COMMENT || null]
    )
    const [rows] = await pool.query('SELECT * FROM reviews WHERE review_id = ?', [result.insertId])
    res.status(201).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
