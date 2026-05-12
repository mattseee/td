const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const { product_id, branch_id } = req.query
    const conditions = []
    const params = []
    if (product_id) { conditions.push('product_id = ?'); params.push(parseInt(product_id)) }
    if (branch_id) { conditions.push('branch_id = ?'); params.push(parseInt(branch_id)) }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const [rows] = await pool.query(
      `SELECT pr.*, b.NAME as branch_name, b.city FROM prices pr LEFT JOIN branches b ON pr.branch_id = b.branch_id ${where} ORDER BY b.city, b.NAME`,
      params
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
