const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')
const { authMiddleware } = require('../middleware/auth')

// Все роуты за authMiddleware
router.use(authMiddleware)

// ─── ЗАКАЗЫ ────────────────────────────────────────────────

// GET /api/account/orders — заказы текущего пользователя
router.get('/orders', async (req, res) => {
  try {
    const userId = req.user.user_id
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))

    const [orders] = await pool.query(
      `SELECT o.order_id, o.status, o.total, o.city, o.address, o.created_at,
              a.city AS addr_city, a.address AS addr_address,
              COUNT(oi.order_item_id) AS item_count
       FROM orders o
       LEFT JOIN addresses  a  ON o.address_id  = a.address_id
       LEFT JOIN orderitems oi ON oi.order_id   = o.order_id
       WHERE o.user_id = ?
       GROUP BY o.order_id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, (page - 1) * limit]
    )

    const [[{ total_count }]] = await pool.query(
      'SELECT COUNT(*) AS total_count FROM orders WHERE user_id = ?',
      [userId]
    )

    res.json({ success: true, data: orders, total: total_count, page })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/account/orders/:id — детали заказа (только своего)
router.get('/orders/:id', async (req, res) => {
  try {
    const userId  = req.user.user_id
    const orderId = parseInt(req.params.id)

    const [orders] = await pool.query(
      `SELECT o.*, a.city AS addr_city, a.address AS addr_address
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.address_id
       WHERE o.order_id = ?`,
      [orderId]
    )
    if (!orders.length) {
      return res.status(404).json({ success: false, error: 'Заказ не найден' })
    }

    const order = orders[0]
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Доступ запрещён' })
    }

    const [items] = await pool.query(
      `SELECT oi.order_item_id, oi.product_id, oi.quantity, oi.price,
              p.NAME AS product_name, p.sku,
              (SELECT pm.url FROM productmedia pm
               WHERE pm.product_id = p.product_id AND pm.TYPE = 'image'
               ORDER BY pm.media_id LIMIT 1) AS main_image
       FROM orderitems oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    )

    res.json({ success: true, data: { ...order, items } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// POST /api/account/orders — создать заказ
router.post('/orders', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const userId = req.user.user_id
    const { items, address_id, branch_id } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      await connection.rollback()
      connection.release()
      return res.status(400).json({ success: false, error: 'Корзина пуста' })
    }

    // Проверяем валидность каждого товара
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1 || item.price == null) {
        await connection.rollback()
        connection.release()
        return res.status(400).json({ success: false, error: 'Некорректные данные товара' })
      }
    }

    // Создаём запись заказа (total = 0, пересчитаем после)
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, status, total, address_id) VALUES (?, ?, ?, ?)',
      [userId, 'pending', 0, address_id || null]
    )
    const orderId = orderResult.insertId

    // Вставляем позиции, используем цену от клиента (зафиксированную в корзине)
    for (const item of items) {
      await connection.query(
        'INSERT INTO orderitems (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      )
    }

    // Пересчитываем total на бэке — не доверяем значению от клиента
    const [[{ computed_total }]] = await connection.query(
      'SELECT SUM(quantity * price) AS computed_total FROM orderitems WHERE order_id = ?',
      [orderId]
    )

    const clientTotal = parseFloat(req.body.total) || 0
    if (Math.abs(clientTotal - parseFloat(computed_total)) > 0.01) {
      console.warn(
        `[orders] total mismatch for order ${orderId}: client=${clientTotal}, computed=${computed_total}`
      )
    }

    await connection.query(
      'UPDATE orders SET total = ? WHERE order_id = ?',
      [computed_total, orderId]
    )

    await connection.commit()
    connection.release()

    res.status(201).json({
      success: true,
      data: { order_id: orderId, total: parseFloat(computed_total), status: 'pending' },
    })
  } catch (err) {
    await connection.rollback()
    connection.release()
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка при создании заказа' })
  }
})

// ─── АДРЕСА ────────────────────────────────────────────────

// GET /api/account/addresses
router.get('/addresses', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// POST /api/account/addresses
router.post('/addresses', async (req, res) => {
  try {
    const { city, address } = req.body
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: 'Укажите город' })
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, error: 'Укажите адрес' })
    }

    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, city, address) VALUES (?, ?, ?)',
      [req.user.user_id, city.trim(), address.trim()]
    )
    const [rows] = await pool.query('SELECT * FROM addresses WHERE address_id = ?', [result.insertId])
    res.status(201).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// DELETE /api/account/addresses/:id
router.delete('/addresses/:id', async (req, res) => {
  try {
    const addrId = parseInt(req.params.id)
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE address_id = ? AND user_id = ?',
      [addrId, req.user.user_id]
    )
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Адрес не найден' })
    }
    await pool.query('DELETE FROM addresses WHERE address_id = ?', [addrId])
    res.json({ success: true, data: null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// ─── ПРОФИЛЬ ────────────────────────────────────────────────

// PUT /api/account/profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.user_id
    const { name, phone, email } = req.body

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email обязателен' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Проверка уникальности email (если меняется)
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [trimmedEmail, userId]
    )
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Этот email уже занят' })
    }

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, email = ? WHERE user_id = ?',
      [name?.trim() || null, phone?.trim() || null, trimmedEmail, userId]
    )

    const [rows] = await pool.query(
      'SELECT user_id, email, name, phone, role, created_at FROM users WHERE user_id = ?',
      [userId]
    )

    res.json({ success: true, data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// PUT /api/account/password
router.put('/password', async (req, res) => {
  try {
    const userId = req.user.user_id
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Укажите старый и новый пароль' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Новый пароль должен содержать минимум 8 символов' })
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE user_id = ?', [userId])
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' })
    }

    const match = await bcrypt.compare(oldPassword, rows[0].password_hash)
    if (!match) {
      return res.status(400).json({ success: false, error: 'Неверный текущий пароль' })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, userId])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
