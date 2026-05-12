const express = require('express')
const router = express.Router()
const pool = require('../db')
const { resolveImageUrl } = require('../utils/getImageUrl')

router.get('/', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        data: { products: [], categories: [], brands: [] } 
      })
    }

    const query = q.trim()
    const startsWith = `${query}%`        // для совпадений в начале (наивысший приоритет)
    const wordBoundary = `% ${query}%`    // отдельное слово в середине
    const contains = `%${query}%`         // подстрока в любом месте
    const lim = Math.min(20, parseInt(limit) || 10)

    // ТОВАРЫ: ищем ТОЛЬКО по NAME, sku и через JOIN по brand.NAME / category.NAME.
    // НЕ ищем по description и productspecifications — там много шума.
    // Считаем relevance score для правильной сортировки.
    const [products] = await pool.query(`
      SELECT 
        p.product_id, 
        p.NAME, 
        p.sku,
        b.NAME as brand_name,
        c.NAME as category_name,
        (SELECT pm.url FROM productmedia pm 
         WHERE pm.product_id = p.product_id AND pm.TYPE = 'image' 
         ORDER BY pm.media_id LIMIT 1) as main_image,
        (
          CASE
            WHEN p.NAME LIKE ? THEN 100         -- начинается с запроса
            WHEN p.NAME LIKE ? THEN 80          -- слово в середине
            WHEN p.sku LIKE ? THEN 70           -- совпадение в артикуле
            WHEN p.NAME LIKE ? THEN 50          -- подстрока в названии
            WHEN b.NAME LIKE ? THEN 30          -- бренд
            WHEN c.NAME LIKE ? THEN 20          -- категория
            ELSE 0
          END
        ) as score
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE 
        p.NAME LIKE ? 
        OR p.sku LIKE ?
        OR b.NAME LIKE ?
        OR c.NAME LIKE ?
      HAVING score > 0
      ORDER BY score DESC, p.NAME ASC
      LIMIT ?
    `, [
      startsWith,    // CASE WHEN NAME LIKE 'мойка%'
      wordBoundary,  // CASE WHEN NAME LIKE '% мойка%'
      contains,      // CASE WHEN sku LIKE '%мойка%'
      contains,      // CASE WHEN NAME LIKE '%мойка%'
      contains,      // CASE WHEN brand LIKE '%мойка%'
      contains,      // CASE WHEN category LIKE '%мойка%'
      contains,      // WHERE NAME LIKE
      contains,      // WHERE sku LIKE
      contains,      // WHERE brand LIKE
      contains,      // WHERE category LIKE
      lim
    ])

    // КАТЕГОРИИ
    const [categories] = await pool.query(
      `SELECT category_id, NAME, slug 
       FROM categories 
       WHERE NAME LIKE ?
       ORDER BY 
         CASE WHEN NAME LIKE ? THEN 0 ELSE 1 END,
         NAME ASC
       LIMIT 5`,
      [contains, startsWith]
    )

    // БРЕНДЫ
    const [brands] = await pool.query(
      `SELECT brand_id, NAME 
       FROM brands 
       WHERE NAME LIKE ?
       ORDER BY 
         CASE WHEN NAME LIKE ? THEN 0 ELSE 1 END,
         NAME ASC
       LIMIT 5`,
      [contains, startsWith]
    )

    res.json({
      success: true,
      data: {
        products: products.map(p => ({ 
          ...p, 
          main_image: resolveImageUrl(p.main_image) 
        })),
        categories,
        brands,
      },
    })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router