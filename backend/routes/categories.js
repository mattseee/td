const express = require('express')
const router = express.Router()
const pool = require('../db')

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

async function getBreadcrumbs(categoryId) {
  const crumbs = []
  let currentId = categoryId
  while (currentId) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [currentId])
    if (!rows.length) break
    crumbs.unshift(rows[0])
    currentId = rows[0].parent_id
  }
  return crumbs
}

router.get('/', async (req, res) => {
  try {
    const { slug } = req.query
    if (slug) {
      const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug])
      if (!rows.length) return res.status(404).json({ success: false, error: 'Категория не найдена' })
      return res.json({ success: true, data: rows[0] })
    }
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY parent_id IS NULL DESC, parent_id, category_id')
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

// GET /api/categories/:id/specs — unique spec names+values for products in this category tree
router.get('/:id/specs', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const catIds = await getCategoryDescendants(id)
    const placeholders = catIds.map(() => '?').join(',')
    const [rows] = await pool.query(`
      SELECT DISTINCT ps.NAME, ps.VALUE
      FROM productspecifications ps
      JOIN products p ON ps.product_id = p.product_id
      WHERE p.category_id IN (${placeholders})
      ORDER BY ps.NAME, ps.VALUE
    `, catIds)
    const specsMap = {}
    rows.forEach(r => {
      if (!specsMap[r.NAME]) specsMap[r.NAME] = []
      specsMap[r.NAME].push(r.VALUE)
    })
    const specs = Object.entries(specsMap).map(([name, values]) => ({ name, values }))
    res.json({ success: true, data: specs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [id])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Категория не найдена' })
    const breadcrumbs = await getBreadcrumbs(id)
    const [children] = await pool.query('SELECT * FROM categories WHERE parent_id = ?', [id])
    res.json({ success: true, data: { ...rows[0], breadcrumbs, children } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: 'Ошибка сервера' })
  }
})

module.exports = router
