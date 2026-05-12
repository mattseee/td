const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
})

module.exports = pool
// Использование: const [rows] = await pool.query('SELECT ...', [params])
// ВСЕГДА параметризованные запросы — никогда не конкатенировать строки в SQL
