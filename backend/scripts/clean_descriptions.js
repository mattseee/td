require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const pool = require('../db')

function decodeHtmlEntities(text) {
  if (!text) return text
  const entities = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&apos;': "'", '&#39;': "'",
    '&mdash;': '—', '&ndash;': '–', '&hellip;': '…',
    '&laquo;': '«', '&raquo;': '»', '&deg;': '°',
    '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
    '&copy;': '©', '&reg;': '®', '&trade;': '™',
    '&euro;': '€', '&pound;': '£', '&yen;': '¥',
  }
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char)
  }
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
  return result
}

function htmlToPlain(html) {
  let text = html
  text = decodeHtmlEntities(text)
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = decodeHtmlEntities(text)
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.split('\n').map(l => l.trim()).join('\n')
  return text.trim()
}

async function cleanColumn(table, idField, column) {
  const [rows] = await pool.query(
    `SELECT ${idField}, \`${column}\` FROM \`${table}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` != ''`
  )

  let updated = 0
  for (const row of rows) {
    const original = row[column]
    const clean = htmlToPlain(original)
    if (clean !== original) {
      await pool.query(
        `UPDATE \`${table}\` SET \`${column}\` = ? WHERE \`${idField}\` = ?`,
        [clean, row[idField]]
      )
      updated++
    }
  }

  return { total: rows.length, updated }
}

async function cleanAll() {
  const tasks = [
    { table: 'products',               idField: 'product_id', column: 'description' },
    { table: 'productspecifications',  idField: 'spec_id',    column: 'VALUE' },
    { table: 'productspecifications',  idField: 'spec_id',    column: 'NAME' },
  ]

  for (const { table, idField, column } of tasks) {
    const { total, updated } = await cleanColumn(table, idField, column)
    console.log(`Очищено ${updated} из ${total} в таблице ${table}.${column}`)
  }

  process.exit(0)
}

cleanAll().catch(err => {
  console.error(err)
  process.exit(1)
})
