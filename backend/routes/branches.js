const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/cities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT city FROM branches ORDER BY city')
    res.json({ success: true, data: rows.map(r => r.city) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { city } = req.query
    const conditions = []
    const params = []
    if (city) { conditions.push('city = ?'); params.push(city) }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const [rows] = await pool.query(`SELECT * FROM branches ${where} ORDER BY city, NAME`, params)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM branches WHERE branch_id = ?', [parseInt(req.params.id)])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Филиал не найден' })
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
