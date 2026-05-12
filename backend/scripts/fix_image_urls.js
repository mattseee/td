'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('../db');

async function fixImages() {
  console.log('Поиск битых URL картинок...');

  const [broken] = await pool.query(
    `SELECT media_id, product_id, url
     FROM productmedia
     WHERE type = 'image' AND url LIKE '%,%'`
  );

  console.log(`Найдено ${broken.length} битых записей`);

  let fixed = 0;
  let extraInserted = 0;
  let errors = 0;

  for (const record of broken) {
    try {
      const urls = String(record.url)
        .split(',')
        .map(u => u.trim())
        .filter(u => u && u.startsWith('http'));

      if (urls.length === 0) {
        errors++;
        continue;
      }

      // Первый URL — обновляем существующую запись
      await pool.query(
        'UPDATE productmedia SET url = ? WHERE media_id = ?',
        [urls[0], record.media_id]
      );
      fixed++;

      // Остальные URL — добавляем как новые записи (галерея)
      for (let i = 1; i < urls.length; i++) {
        await pool.query(
          `INSERT INTO productmedia (product_id, type, url) VALUES (?, 'image', ?)`,
          [record.product_id, urls[i]]
        );
        extraInserted++;
      }
    } catch (err) {
      console.error(`Ошибка на media_id ${record.media_id}:`, err.message);
      errors++;
    }
  }

  console.log('\n=== ОТЧЁТ ===');
  console.log(`Исправлено основных URL:          ${fixed}`);
  console.log(`Добавлено доп. картинок в галерею: ${extraInserted}`);
  console.log(`Ошибок:                            ${errors}`);

  await pool.end();
  process.exit(0);
}

fixImages().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
