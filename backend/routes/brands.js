const express = require('express')
const router = express.Router()
const pool = require('../db')
const { resolveImageUrl } = require('../utils/getImageUrl')

router.get('/', async (req, res) => {
  try {
    const { sort, limit } = req.query

    if (sort === 'popular') {
      const lim = parseInt(limit) || 12
      const [rows] = await pool.query(`
        SELECT b.*, COUNT(p.product_id) as product_count
        FROM brands b
        LEFT JOIN products p ON p.brand_id = b.brand_id
        GROUP BY b.brand_id
        ORDER BY product_count DESC
        LIMIT ?
      `, [lim])
      return res.json({ success: true, data: rows })
    }

    const [rows] = await pool.query('SELECT * FROM brands ORDER BY NAME')
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const [brands] = await pool.query('SELECT * FROM brands WHERE brand_id = ?', [id])
    if (!brands.length) return res.status(404).json({ success: false, error: 'Бренд не найден' })

    const [products] = await pool.query(`
      SELECT p.product_id, p.sku, p.NAME,
        (SELECT pm.url FROM productmedia pm WHERE pm.product_id = p.product_id AND pm.TYPE = 'image' ORDER BY pm.media_id LIMIT 1) as main_image
      FROM products p WHERE p.brand_id = ? ORDER BY p.NAME
    `, [id])

    res.json({
      success: true,
      data: {
        ...brands[0],
        products: products.map(p => ({ ...p, main_image: resolveImageUrl(p.main_image) })),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
