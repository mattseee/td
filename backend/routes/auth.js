const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function safeUser(user) {
  const { password_hash, ...safe } = user
  return safe
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Некорректный email' })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Пароль должен быть не менее 8 символов' })
    }

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()])
    if (existing.length) {
      return res.status(400).json({ success: false, error: 'Email уже зарегистрирован' })
    }

    const hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)',
      [email.trim().toLowerCase(), hash, name?.trim() || null, phone?.trim() || null]
    )

    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [result.insertId])
    const token = signToken(rows[0])

    res.status(201).json({ success: true, data: { token, user: safeUser(rows[0]) } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Укажите email и пароль' })
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' })
    }

    const token = signToken(user)
    res.json({ success: true, data: { token, user: safeUser(user) } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.user_id])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Пользователь не найден' })
    res.json({ success: true, data: safeUser(rows[0]) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
