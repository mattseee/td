require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const bcrypt = require('bcryptjs')
const mysql = require('mysql2/promise')

const USERS = [
  { email: 'admin@stroyhub.local', password: 'admin12345', name: 'Администратор',  phone: '+7 (495) 000-00-00', role: 'admin' },
  { email: 'user@stroyhub.local',  password: 'user12345',  name: 'Иван Петров',    phone: '+7 (916) 123-45-67', role: 'user'  },
  { email: 'test@stroyhub.local',  password: 'test12345',  name: 'Тест Тестов',    phone: '+7 (999) 888-77-66', role: 'user'  },
]

async function run() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    database: process.env.DB_NAME     || 'products_db',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    charset:  'utf8mb4',
  })

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10)
    await pool.query(
      `INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name), role = VALUES(role)`,
      [u.email, hash, u.name, u.phone, u.role]
    )
    console.log(`✓ [${u.role}] ${u.email}  /  пароль: ${u.password}`)
  }

  await pool.end()
  console.log('\nГотово!')
}

run().catch(err => { console.error(err); process.exit(1) })
