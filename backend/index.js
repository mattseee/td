require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth',        require('./routes/auth'))
app.use('/api/products',    require('./routes/products'))
app.use('/api/categories',  require('./routes/categories'))
app.use('/api/brands',      require('./routes/brands'))
app.use('/api/branches',    require('./routes/branches'))
app.use('/api/suppliers',   require('./routes/suppliers'))
app.use('/api/promotions',  require('./routes/promotions'))
app.use('/api/prices',      require('./routes/prices'))
app.use('/api/stock',       require('./routes/stock'))
app.use('/api/search',      require('./routes/search'))
app.use('/api/account',     require('./routes/account'))
app.use('/api/admin',       require('./routes/admin'))

app.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'ТД Сток API', version: '1.0', status: 'ok', frontend: 'http://localhost:3000' } })
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
