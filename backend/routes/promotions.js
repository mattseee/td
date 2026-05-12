const express = require('express')
const router = express.Router()
const pool = require('../db')
const { resolveImageUrl } = require('../utils/getImageUrl')

router.get('/', async (req, res) => {
  try {
    const { active } = req.query
    let where = ''
    if (active === 'true' || active === '1') {
      where = 'WHERE CURDATE() BETWEEN valid_from AND valid_to'
    }
    const [rows] = await pool.query(`SELECT * FROM promotions ${where} ORDER BY valid_from DESC`)
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const [promos] = await pool.query('SELECT * FROM promotions WHERE promotion_id = ?', [id])
    if (!promos.length) return res.status(404).json({ success: false, error: 'Акция не найдена' })

    const [products] = await pool.query(`
      SELECT p.product_id, p.sku, p.NAME, pp.promo_price,
        b.NAME as brand_name,
        (SELECT pm.url FROM productmedia pm WHERE pm.product_id = p.product_id AND pm.TYPE = 'image' ORDER BY pm.media_id LIMIT 1) as main_image
      FROM productpromotions pp
      JOIN products p ON pp.product_id = p.product_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE pp.promotion_id = ?
    `, [id])

    res.json({
      success: true,
      data: {
        ...promos[0],
        products: products.map(p => ({ ...p, main_image: resolveImageUrl(p.main_image) })),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
