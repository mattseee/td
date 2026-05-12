const express = require('express')
const router = express.Router()
const pool = require('../db')
const path = require('path')
const fs = require('fs')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { resolveImageUrl } = require('../utils/getImageUrl')

router.use(authMiddleware, adminMiddleware)

// ─── СТАТИСТИКА ────────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products')
    const [[{ ordersToday }]] = await pool.query(
      "SELECT COUNT(*) AS ordersToday FROM orders WHERE DATE(created_at) = CURDATE()"
    )
    const [[{ ordersMonth }]] = await pool.query(
      "SELECT COUNT(*) AS ordersMonth FROM orders WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')"
    )
    const [[{ revenueMonth }]] = await pool.query(
      "SELECT COALESCE(SUM(total),0) AS revenueMonth FROM orders WHERE status='completed' AND created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')"
    )
    const [[{ newUsersMonth }]] = await pool.query(
      "SELECT COUNT(*) AS newUsersMonth FROM users WHERE created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')"
    )
    const [recentOrders] = await pool.query(
      `SELECT o.order_id, o.status, o.total, o.created_at, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       ORDER BY o.created_at DESC
       LIMIT 10`
    )
    res.json({
      success: true,
      data: { totalProducts, ordersToday, ordersMonth, revenueMonth: parseFloat(revenueMonth), newUsersMonth, recentOrders }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// ─── ТОВАРЫ ────────────────────────────────────────────────────────────────

router.get('/products', async (req, res) => {
  try {
    const { q, category_id, page = 1, limit = 20 } = req.query
    const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)))
    const lim = Math.min(100, Math.max(1, parseInt(limit)))

    let where = []
    let params = []

    if (q) {
      where.push('(p.NAME LIKE ? OR p.sku LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }
    if (category_id) {
      where.push('p.category_id = ?')
      params.push(parseInt(category_id))
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const [products] = await pool.query(
      `SELECT p.*, c.NAME AS category_name, b.NAME AS brand_name,
              (SELECT MIN(pr.price) FROM prices pr WHERE pr.product_id = p.product_id) AS min_price,
              (SELECT pm.url FROM productmedia pm WHERE pm.product_id = p.product_id AND pm.TYPE='image' ORDER BY pm.media_id LIMIT 1) AS main_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       ${whereClause}
       ORDER BY p.product_id DESC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
      params
    )

    const mapped = products.map(p => ({ ...p, main_image: resolveImageUrl(p.main_image) }))
    res.json({ success: true, data: mapped, total, page: parseInt(page) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    const [rows] = await pool.query(
      `SELECT p.*, c.NAME AS category_name, b.NAME AS brand_name, s.NAME AS supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE p.product_id = ?`,
      [productId]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Товар не найден' })

    const [specs] = await pool.query('SELECT * FROM productspecifications WHERE product_id = ? ORDER BY spec_id', [productId])
    const [prices] = await pool.query(
      `SELECT pr.*, b.NAME AS branch_name FROM prices pr
       LEFT JOIN branches b ON pr.branch_id = b.branch_id
       WHERE pr.product_id = ? ORDER BY pr.price_id`,
      [productId]
    )
    const [media] = await pool.query('SELECT * FROM productmedia WHERE product_id = ? ORDER BY media_id', [productId])

    const mappedMedia = media.map(m => ({ ...m, url: resolveImageUrl(m.url) }))
    function toDateStr(val) {
      if (!val) return ''
      if (val instanceof Date) return val.toISOString().split('T')[0]
      return String(val).split('T')[0]
    }
    const mappedPrices = prices.map(p => ({
      ...p,
      valid_from: toDateStr(p.valid_from),
      valid_to: toDateStr(p.valid_to),
    }))

    res.json({ success: true, data: { ...rows[0], specifications: specs, prices: mappedPrices, media: mappedMedia } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.post('/products', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const {
      NAME, sku, description, hs_code, weight, is_exclusive,
      category_id, brand_id, supplier_id,
      power_cold, power_heat, size_internal, size_external, air_flow,
      specifications = [], prices = []
    } = req.body

    if (!NAME || !NAME.trim()) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }

    const [result] = await connection.query(
      `INSERT INTO products (NAME, sku, description, hs_code, weight, is_exclusive, category_id, brand_id, supplier_id, power_cold, power_heat, size_internal, size_external, air_flow)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        NAME.trim(), sku || null, description || null, hs_code || null,
        weight || null, is_exclusive ? 1 : 0,
        category_id || null, brand_id || null, supplier_id || null,
        power_cold || null, power_heat || null,
        size_internal || null, size_external || null, air_flow || null
      ]
    )

    const productId = result.insertId

    if (Array.isArray(specifications) && specifications.length > 0) {
      for (const s of specifications) {
        if (s.NAME && s.VALUE) {
          await connection.query(
            'INSERT INTO productspecifications (product_id, NAME, VALUE, unit) VALUES (?, ?, ?, ?)',
            [productId, s.NAME, s.VALUE, s.unit || null]
          )
        }
      }
    }

    if (Array.isArray(prices) && prices.length > 0) {
      for (const p of prices) {
        if (p.branch_id && p.price) {
          await connection.query(
            'INSERT INTO prices (product_id, supplier_id, branch_id, price, discount_price, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [productId, supplier_id || null, p.branch_id, p.price, p.discount_price || null, p.valid_from || null, p.valid_to || null]
          )
        }
      }
    }

    await connection.commit()
    connection.release()

    res.status(201).json({ success: true, data: { product_id: productId } })
  } catch (err) {
    await connection.rollback()
    connection.release()
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при создании товара' })
  }
})

router.put('/products/:id', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const productId = parseInt(req.params.id)
    const {
      NAME, sku, description, hs_code, weight, is_exclusive,
      category_id, brand_id, supplier_id,
      power_cold, power_heat, size_internal, size_external, air_flow,
      specifications = [], prices = []
    } = req.body

    if (!NAME || !NAME.trim()) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }

    const [existing] = await connection.query('SELECT product_id FROM products WHERE product_id = ?', [productId])
    if (!existing.length) {
      await connection.rollback()
      connection.release()
      return res.status(404).json({ success: false, error: 'Товар не найден' })
    }

    await connection.query(
      `UPDATE products SET NAME=?, sku=?, description=?, hs_code=?, weight=?, is_exclusive=?,
       category_id=?, brand_id=?, supplier_id=?, power_cold=?, power_heat=?,
       size_internal=?, size_external=?, air_flow=?
       WHERE product_id=?`,
      [
        NAME.trim(), sku || null, description || null, hs_code || null,
        weight || null, is_exclusive ? 1 : 0,
        category_id || null, brand_id || null, supplier_id || null,
        power_cold || null, power_heat || null,
        size_internal || null, size_external || null, air_flow || null,
        productId
      ]
    )

    // полный replace specs
    await connection.query('DELETE FROM productspecifications WHERE product_id = ?', [productId])
    if (Array.isArray(specifications) && specifications.length > 0) {
      for (const s of specifications) {
        if (s.NAME && s.VALUE) {
          await connection.query(
            'INSERT INTO productspecifications (product_id, NAME, VALUE, unit) VALUES (?, ?, ?, ?)',
            [productId, s.NAME, s.VALUE, s.unit || null]
          )
        }
      }
    }

    // полный replace prices
    await connection.query('DELETE FROM prices WHERE product_id = ?', [productId])
    if (Array.isArray(prices) && prices.length > 0) {
      for (const p of prices) {
        if (p.branch_id && p.price) {
          await connection.query(
            'INSERT INTO prices (product_id, supplier_id, branch_id, price, discount_price, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [productId, supplier_id || null, p.branch_id, p.price, p.discount_price || null, p.valid_from || null, p.valid_to || null]
          )
        }
      }
    }

    await connection.commit()
    connection.release()

    res.json({ success: true, data: { product_id: productId } })
  } catch (err) {
    await connection.rollback()
    connection.release()
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при обновлении товара' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [productId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Товар не найден' })
    }

    // Удаляем локальные медиафайлы
    const [media] = await pool.query("SELECT url FROM productmedia WHERE product_id = ? AND TYPE='image'", [productId])
    for (const m of media) {
      if (m.url && !m.url.startsWith('http')) {
        const filePath = path.join(__dirname, '../uploads', m.url)
        try { fs.unlinkSync(filePath) } catch {}
      }
    }

    await pool.query('DELETE FROM products WHERE product_id = ?', [productId])
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при удалении товара' })
  }
})

router.post('/products/:id/media', upload.single('file'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен или неверный формат' })
    }

    const [result] = await pool.query(
      "INSERT INTO productmedia (product_id, TYPE, url) VALUES (?, 'image', ?)",
      [productId, req.file.filename]
    )
    res.status(201).json({
      success: true,
      data: { media_id: result.insertId, url: resolveImageUrl(req.file.filename) }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при загрузке файла' })
  }
})

router.post('/products/:id/media-url', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    const { url, type = 'image' } = req.body

    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'URL обязателен' })
    }
    const allowed = ['image', 'video', 'doc']
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, error: 'Неверный тип медиа' })
    }

    const [result] = await pool.query(
      'INSERT INTO productmedia (product_id, TYPE, url) VALUES (?, ?, ?)',
      [productId, type, url.trim()]
    )
    res.status(201).json({
      success: true,
      data: { media_id: result.insertId, url: resolveImageUrl(url.trim()), type }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.delete('/media/:id', async (req, res) => {
  try {
    const mediaId = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT * FROM productmedia WHERE media_id = ?', [mediaId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Медиафайл не найден' })
    }

    const media = rows[0]
    if (!media.url.startsWith('http')) {
      const filePath = path.join(__dirname, '../uploads', media.url)
      try { fs.unlinkSync(filePath) } catch {}
    }

    await pool.query('DELETE FROM productmedia WHERE media_id = ?', [mediaId])
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при удалении медиа' })
  }
})

// ─── ЗАКАЗЫ ────────────────────────────────────────────────────────────────

router.get('/orders', async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query
    const lim = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (Math.max(1, parseInt(page)) - 1) * lim

    let where = []
    let params = []

    if (status) {
      where.push('o.status = ?')
      params.push(status)
    }
    if (q) {
      where.push('u.email LIKE ?')
      params.push(`%${q}%`)
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const [orders] = await pool.query(
      `SELECT o.order_id, o.status, o.total, o.created_at,
              u.email, u.name AS user_name, u.phone
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    )

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN users u ON o.user_id = u.user_id ${whereClause}`,
      params
    )

    res.json({ success: true, data: orders, total, page: parseInt(page) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id)
    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.name AS user_name, u.phone,
              a.city AS addr_city, a.address AS addr_address
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = ?`,
      [orderId]
    )
    if (!orders.length) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' })
    }
    const [items] = await pool.query(
      `SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price,
              p.NAME AS product_name, p.sku,
              (SELECT pm.url FROM productmedia pm
               WHERE pm.product_id = p.product_id AND pm.TYPE='image'
               ORDER BY pm.media_id LIMIT 1) AS main_image
       FROM orderitems oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    )
    const mappedItems = items.map(i => ({ ...i, main_image: resolveImageUrl(i.main_image) }))
    res.json({ success: true, data: { ...orders[0], items: mappedItems } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.put('/orders/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id)
    const { status } = req.body
    const allowed = ['pending', 'processing', 'completed', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Недопустимый статус' })
    }
    const [rows] = await pool.query('SELECT order_id FROM orders WHERE order_id = ?', [orderId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' })
    }
    await pool.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId])
    const [updated] = await pool.query(
      `SELECT o.*, u.email, u.name AS user_name FROM orders o
       JOIN users u ON o.user_id = u.user_id WHERE o.order_id = ?`,
      [orderId]
    )
    res.json({ success: true, data: updated[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// ─── ПОЛЬЗОВАТЕЛИ ──────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query
    const lim = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (Math.max(1, parseInt(page)) - 1) * lim

    let where = []
    let params = []
    if (q) {
      where.push('(email LIKE ? OR name LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const [users] = await pool.query(
      `SELECT user_id, email, name, phone, role, created_at
       FROM users ${whereClause}
       ORDER BY user_id DESC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    )
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    )
    res.json({ success: true, data: users, total, page: parseInt(page) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.put('/users/:id/role', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id)
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Недопустимая роль' })
    }
    if (req.user.user_id === targetId && role === 'user') {
      return res.status(400).json({ success: false, error: 'Нельзя понизить собственную роль' })
    }

    const [rows] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [targetId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' })
    }

    await pool.query('UPDATE users SET role = ? WHERE user_id = ?', [role, targetId])
    const [updated] = await pool.query(
      'SELECT user_id, email, name, phone, role, created_at FROM users WHERE user_id = ?',
      [targetId]
    )
    res.json({ success: true, data: updated[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// ─── КАТЕГОРИИ ─────────────────────────────────────────────────────────────

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.category_id, c.NAME, c.parent_id, p.NAME AS parent_name
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.category_id
       ORDER BY c.parent_id IS NULL DESC, c.parent_id, c.NAME`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.post('/categories', async (req, res) => {
  try {
    const { NAME, parent_id } = req.body
    if (!NAME || !NAME.trim()) {
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }
    const [result] = await pool.query(
      'INSERT INTO categories (NAME, parent_id) VALUES (?, ?)',
      [NAME.trim(), parent_id || null]
    )
    res.status(201).json({ success: true, data: { category_id: result.insertId, NAME: NAME.trim(), parent_id: parent_id || null } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.put('/categories/:id', async (req, res) => {
  try {
    const catId = parseInt(req.params.id)
    const { NAME, parent_id } = req.body
    if (!NAME || !NAME.trim()) {
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }
    const [rows] = await pool.query('SELECT category_id FROM categories WHERE category_id = ?', [catId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Категория не найдена' })
    }
    await pool.query('UPDATE categories SET NAME = ?, parent_id = ? WHERE category_id = ?', [NAME.trim(), parent_id || null, catId])
    res.json({ success: true, data: { category_id: catId, NAME: NAME.trim(), parent_id: parent_id || null } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.delete('/categories/:id', async (req, res) => {
  try {
    const catId = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT category_id FROM categories WHERE category_id = ?', [catId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Категория не найдена' })
    }

    const [[{ childCount }]] = await pool.query(
      'SELECT COUNT(*) AS childCount FROM categories WHERE parent_id = ?', [catId]
    )
    const [[{ productCount }]] = await pool.query(
      'SELECT COUNT(*) AS productCount FROM products WHERE category_id = ?', [catId]
    )

    if (childCount > 0 || productCount > 0) {
      return res.status(400).json({ success: false, error: 'Сначала удалите содержимое' })
    }

    await pool.query('DELETE FROM categories WHERE category_id = ?', [catId])
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// ─── АКЦИИ ─────────────────────────────────────────────────────────────────

router.get('/promotions', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM promotions ORDER BY valid_from DESC')
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.post('/promotions', async (req, res) => {
  try {
    const { NAME, description, valid_from, valid_to } = req.body
    if (!NAME || !NAME.trim()) {
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }
    const [result] = await pool.query(
      'INSERT INTO promotions (NAME, description, valid_from, valid_to) VALUES (?, ?, ?, ?)',
      [NAME.trim(), description || null, valid_from || null, valid_to || null]
    )
    res.status(201).json({ success: true, data: { promotion_id: result.insertId } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.put('/promotions/:id', async (req, res) => {
  try {
    const promoId = parseInt(req.params.id)
    const { NAME, description, valid_from, valid_to } = req.body
    if (!NAME || !NAME.trim()) {
      return res.status(400).json({ success: false, error: 'Название обязательно' })
    }
    const [rows] = await pool.query('SELECT promotion_id FROM promotions WHERE promotion_id = ?', [promoId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Акция не найдена' })
    }
    await pool.query(
      'UPDATE promotions SET NAME = ?, description = ?, valid_from = ?, valid_to = ? WHERE promotion_id = ?',
      [NAME.trim(), description || null, valid_from || null, valid_to || null, promoId]
    )
    res.json({ success: true, data: { promotion_id: promoId } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.delete('/promotions/:id', async (req, res) => {
  try {
    const promoId = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT promotion_id FROM promotions WHERE promotion_id = ?', [promoId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Акция не найдена' })
    }
    await pool.query('DELETE FROM promotions WHERE promotion_id = ?', [promoId])
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/promotions/:id', async (req, res) => {
  try {
    const promoId = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT * FROM promotions WHERE promotion_id = ?', [promoId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Акция не найдена' })
    }
    const [products] = await pool.query(
      `SELECT pp.id, pp.product_id, pp.promo_price, p.NAME, p.sku,
              (SELECT pm.url FROM productmedia pm WHERE pm.product_id = p.product_id AND pm.TYPE='image' ORDER BY pm.media_id LIMIT 1) AS main_image
       FROM productpromotions pp
       JOIN products p ON pp.product_id = p.product_id
       WHERE pp.promotion_id = ?`,
      [promoId]
    )
    const mappedProducts = products.map(p => ({ ...p, main_image: resolveImageUrl(p.main_image) }))
    res.json({ success: true, data: { ...rows[0], products: mappedProducts } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.post('/promotions/:id/products', async (req, res) => {
  try {
    const promoId = parseInt(req.params.id)
    const { product_id, promo_price } = req.body
    if (!product_id || !promo_price) {
      return res.status(400).json({ success: false, error: 'product_id и promo_price обязательны' })
    }
    const [existing] = await pool.query(
      'SELECT id FROM productpromotions WHERE promotion_id = ? AND product_id = ?',
      [promoId, product_id]
    )
    if (existing.length) {
      await pool.query(
        'UPDATE productpromotions SET promo_price = ? WHERE promotion_id = ? AND product_id = ?',
        [promo_price, promoId, product_id]
      )
    } else {
      await pool.query(
        'INSERT INTO productpromotions (product_id, promotion_id, promo_price) VALUES (?, ?, ?)',
        [product_id, promoId, promo_price]
      )
    }
    res.status(201).json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.delete('/promotions/:promoId/products/:productId', async (req, res) => {
  try {
    const promoId = parseInt(req.params.promoId)
    const productId = parseInt(req.params.productId)
    await pool.query(
      'DELETE FROM productpromotions WHERE promotion_id = ? AND product_id = ?',
      [promoId, productId]
    )
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
