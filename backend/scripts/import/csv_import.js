'use strict';

const path = require('path');
const fs   = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ExcelJS = require('exceljs');
const mysql   = require('mysql2/promise');

// ─── Пути ─────────────────────────────────────────────────────────────────────
const XLSX_FILE       = path.join(__dirname, '../../import_data/catalog.xlsx');
const ERROR_LOG       = path.join(__dirname, 'errors.log');
const CLEAR_SQL_FILE  = path.join(__dirname, '../../sql/99_clear_seeds.sql');
const MIGRATE_SQL_FILE= path.join(__dirname, '../../sql/06_fix_sku_unique.sql');
const BATCH_SIZE      = 200;

// ─── Транслитерация (для генерации slug) ─────────────────────────────────────
const TR = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh',
  'щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
};
function translit(s) {
  return s.toLowerCase().split('').map(c => TR[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}
function makeSlug(levels) {
  return levels.map(translit).join('--').substring(0, 250);
}

// ─── Вспомогательные функции для значений ячеек ExcelJS ──────────────────────
function cellText(val) {
  if (val == null) return '';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.richText)  return val.richText.map(r => r.text || '').join('');
    if (val.hyperlink) return val.hyperlink;           // гиперссылка → URL
    if (val.text != null) return String(val.text);
    if (val.result != null) return String(val.result); // формула
    return String(val);
  }
  return String(val);
}

// Для URL-столбцов: предпочитаем hyperlink, если есть
function cellUrl(val) {
  if (val == null) return '';
  if (typeof val === 'object') {
    if (val.hyperlink) return val.hyperlink;
    if (val.richText)  return val.richText.map(r => r.text || '').join('');
    if (val.text != null) return String(val.text);
    return String(val);
  }
  return String(val);
}

// ─── Парсинг цены ─────────────────────────────────────────────────────────────
function parsePrice(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val > 0 ? val : null;
  const s = cellText(val).trim();
  // "12345 руб." или "12 345 руб."
  const m = s.match(/^([\d\s]+(?:[.,]\d+)?)\s*руб\.?$/i);
  if (m) return parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
  const n = parseFloat(s.replace(',', '.'));
  return (!isNaN(n) && n > 0) ? n : null;
}

// ─── Парсинг признака «Эксклюзив» ────────────────────────────────────────────
function parseExclusive(val) {
  return /Да/i.test(cellText(val)) ? 1 : 0;
}

// ─── Парсинг единиц измерения из значения ────────────────────────────────────
const UNIT_RE = /^(.*?)\s+(кг|г|мм|см|м²|м³|м|°[CС]|кВт|Вт|В|А|Гц|л|шт|лет|год|мес|мин|сек)$/u;
function parseValueUnit(raw) {
  const s = String(raw || '').trim();
  const m = s.match(UNIT_RE);
  if (m) return { value: m[1].trim(), unit: m[2] };
  return { value: s, unit: '' };
}

// ─── Парсинг блока характеристик ─────────────────────────────────────────────
function parseSpecs(rawVal) {
  const s = cellText(rawVal).trim();
  if (!s) return [];
  return s.split(/\s*\/\s*/).map(part => {
    const idx = part.indexOf(':');
    if (idx < 0) return null;
    const name    = part.substring(0, idx).trim().substring(0, 255);
    const rawSpec = part.substring(idx + 1).trim();
    if (!name || !rawSpec) return null;
    const { value, unit } = parseValueUnit(rawSpec);
    return { name, value: value.substring(0, 255), unit: unit.substring(0, 50) };
  }).filter(Boolean);
}

// ─── Извлечение веса из характеристик ────────────────────────────────────────
function extractWeight(rawVal) {
  const s = cellText(rawVal);
  const m = s.match(/(?:Вес[^:/]*|Масса[^:/]*)\s*:\s*([\d.,]+)\s*кг/i);
  if (m) return parseFloat(m[1].replace(',', '.'));
  return null;
}

// ─── Чтение XLSX (не-стриминговый, 16 K строк влезает в RAM легко) ───────────
async function loadXlsx() {
  process.stdout.write('Чтение XLSX...');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_FILE);
  const ws = wb.getWorksheet(1);

  const rows = [];
  let firstRow = true;
  ws.eachRow((row, rowNumber) => {
    if (firstRow) {
      firstRow = false;
      // Логируем заголовки для диагностики
      const headers = [];
      for (let i = 1; i <= 18; i++) headers.push(cellText(row.values[i]));
      console.log('\nЗаголовки:', headers.join(' | '));
      return;
    }
    // Пропускаем полностью пустые строки
    if (!row.values || row.values.every(v => v == null || v === '')) return;
    rows.push({ num: rowNumber, v: row.values });
  });
  console.log(`Строк данных: ${rows.length}`);
  return rows;
}

// ─── Выполнение SQL-файла (разбиваем по ; и исполняем поочерёдно) ────────────
async function runSqlFile(conn, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const stmts = sql
    .replace(/--[^\n]*/g, '')   // убираем комментарии
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of stmts) {
    try {
      await conn.query(stmt);
    } catch (err) {
      // Игнорируем «индекс не существует» / «уже существует»
      const safe = ['ER_DUP_KEYNAME', 'ER_CANT_DROP_FIELD_OR_KEY', 'ER_TABLE_EXISTS_ERROR'];
      if (!safe.includes(err.code)) throw err;
    }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(XLSX_FILE)) {
    console.error(`Файл не найден: ${XLSX_FILE}`);
    process.exit(1);
  }

  const errLog = fs.createWriteStream(ERROR_LOG, { flags: 'w' });
  const logErr = (num, msg) => errLog.write(`[Строка ${num}] ${msg}\n`);
  const startTime = Date.now();

  console.log('══════════════════════════════════════════');
  console.log('  Импорт каталога в products_db');
  console.log('══════════════════════════════════════════');

  // ── 1. Загрузка XLSX ──────────────────────────────────────────────────────
  const rows = await loadXlsx();

  // ── 2. Первый проход: сбор уникальных брендов и категорий ─────────────────
  const brandOrigMap = new Map(); // norm(name) → original name
  const catPathSet   = new Set(); // уникальные пути категорий

  for (const { v } of rows) {
    const brand   = cellText(v[3]).trim();
    const catPath = cellText(v[4]).trim();
    if (brand)   brandOrigMap.set(brand.toLowerCase(), brand);
    if (catPath) catPathSet.add(catPath);
  }
  console.log(`Уникальных брендов: ${brandOrigMap.size}`);
  console.log(`Уникальных путей категорий: ${catPathSet.size}`);

  // ── 3. Подключение к БД ──────────────────────────────────────────────────
  const pool = mysql.createPool({
    host:             process.env.DB_HOST     || 'localhost',
    port:       parseInt(process.env.DB_PORT) || 3306,
    database:         process.env.DB_NAME     || 'products_db',
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
  });

  const conn = await pool.getConnection();
  try {
    // ── 4. Очистка тестовых данных ──────────────────────────────────────────
    console.log('Очистка тестовых данных...');
    await runSqlFile(conn, CLEAR_SQL_FILE);

    // ── 5. Миграция (составной уникальный ключ sku+brand_id) ────────────────
    console.log('Применение миграции SKU...');
    await runSqlFile(conn, MIGRATE_SQL_FILE);

    // ── 6. Филиал Санкт-Петербург ────────────────────────────────────────────
    const [brRows] = await conn.query(
      "SELECT branch_id FROM branches WHERE city LIKE '%Санкт-Петербург%' LIMIT 1"
    );
    let branchSpbId;
    if (brRows.length) {
      branchSpbId = brRows[0].branch_id;
    } else {
      const [r] = await conn.execute(
        'INSERT INTO branches (name, city, address, contact_info) VALUES (?, ?, ?, ?)',
        ['ТД Сток Купчино', 'Санкт-Петербург', 'ул. Бухарестская, д. 30', '+7 (812) 777-88-99']
      );
      branchSpbId = r.insertId;
    }
    console.log(`Филиал СПб: branch_id = ${branchSpbId}`);

    // ── 7. Поставщик ─────────────────────────────────────────────────────────
    const [spRows] = await conn.query(
      'SELECT supplier_id FROM suppliers ORDER BY supplier_id LIMIT 1'
    );
    let supplierId;
    if (spRows.length) {
      supplierId = spRows[0].supplier_id;
    } else {
      const [r] = await conn.execute(
        "INSERT INTO suppliers (name, contact_info) VALUES ('Основной поставщик', '')"
      );
      supplierId = r.insertId;
    }
    console.log(`Поставщик: supplier_id = ${supplierId}`);

    // ── 8. Создание брендов ───────────────────────────────────────────────────
    console.log(`Создание ${brandOrigMap.size} брендов...`);
    const brandIdMap = new Map(); // norm → brand_id
    const brandEntries = [...brandOrigMap.entries()];
    for (const [norm, orig] of brandEntries) {
      const [r] = await conn.execute(
        'INSERT INTO brands (name) VALUES (?)',
        [orig.substring(0, 255)]
      );
      brandIdMap.set(norm, r.insertId);
    }
    console.log(`Брендов создано: ${brandIdMap.size}`);

    // ── 9. Создание дерева категорий ─────────────────────────────────────────
    console.log(`Создание дерева категорий из ${catPathSet.size} путей...`);
    const catNodeMap = new Map(); // `${parentId}|${name}` → cat_id
    const catLeafMap = new Map(); // fullPath → leaf cat_id
    const slugsUsed  = new Set();

    function uniqueSlug(levels) {
      let base = makeSlug(levels);
      if (!slugsUsed.has(base)) { slugsUsed.add(base); return base; }
      let i = 2;
      while (slugsUsed.has(`${base}-${i}`)) i++;
      const s = `${base}-${i}`;
      slugsUsed.add(s);
      return s;
    }

    for (const fullPath of [...catPathSet].sort()) {
      const levels = fullPath.split(' - ').map(s => s.trim()).filter(Boolean);
      let parentId = null;
      const pathSoFar = [];

      for (const name of levels) {
        const nodeKey = `${parentId}|${name}`;
        pathSoFar.push(name);
        if (!catNodeMap.has(nodeKey)) {
          const slug = uniqueSlug([...pathSoFar]);
          const [r] = await conn.execute(
            'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
            [name.substring(0, 255), slug, parentId]
          );
          catNodeMap.set(nodeKey, r.insertId);
        }
        parentId = catNodeMap.get(nodeKey);
      }
      catLeafMap.set(fullPath, parentId);
    }
    console.log(`Категорий создано: ${catNodeMap.size}`);

    // ── 10. Импорт товаров ───────────────────────────────────────────────────
    console.log(`\nНачало импорта товаров (батчи по ${BATCH_SIZE})...`);
    let imported = 0, skipped = 0, errors = 0;
    const seenKeys = new Set();

    for (let bStart = 0; bStart < rows.length; bStart += BATCH_SIZE) {
      const batch = rows.slice(bStart, bStart + BATCH_SIZE);

      await conn.beginTransaction();
      try {
        for (const { num: rowNum, v } of batch) {
          // Колонки (1-based, соответствуют колонкам A–R):
          // 1=Наименование, 2=Артикул, 3=Бренд, 4=Категория, 5=Характеристики,
          // 6=Изображение, 7=Видео, 8=Сопут (ign), 9=Аналоги (ign),
          // 10=Статья, 11=Чертежи, 12=Сертификаты, 13=Промоматериалы, 14=Инструкции,
          // 15=Штрих-код (ign), 16=Цена, 17=НС-код, 18=Эксклюзив
          const name     = cellText(v[1]).trim();
          const sku      = cellText(v[2]).trim();
          const brand    = cellText(v[3]).trim();
          const catPath  = cellText(v[4]).trim();
          const specsRaw = v[5];
          const imgRaw   = cellUrl(v[6]);
          const videoRaw = cellUrl(v[7]).trim();
          const article  = cellText(v[10]);
          const charUrl  = cellUrl(v[11]).trim();
          const certUrl  = cellUrl(v[12]).trim();
          const promoUrl = cellUrl(v[13]).trim();
          const instrUrl = cellUrl(v[14]).trim();
          const priceRaw = v[16];
          const hsCode   = cellText(v[17]).trim();
          const exclRaw  = v[18];

          if (!name) continue;

          // Дедупликация по бренд+наименование
          const dedupKey = brand.toLowerCase() + '|' + name.toLowerCase().replace(/\s+/g, ' ');
          if (seenKeys.has(dedupKey)) { skipped++; continue; }
          seenKeys.add(dedupKey);

          // Цена обязательна
          const price = parsePrice(priceRaw);
          if (price === null) {
            errors++;
            logErr(rowNum, `Неверная цена: "${cellText(priceRaw)}"`);
            continue;
          }

          const brandId = brandIdMap.get(brand.toLowerCase()) || null;
          const catId   = catPath ? (catLeafMap.get(catPath) || null) : null;
          const weight  = extractWeight(specsRaw);
          const isExcl  = parseExclusive(exclRaw);

          try {
            // products
            const [pRes] = await conn.execute(
              `INSERT INTO products
               (supplier_id, category_id, brand_id, sku, name, description, hs_code, weight, is_exclusive)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                supplierId,
                catId,
                brandId,
                sku || null,
                name.substring(0, 255),
                article || null,
                hsCode || null,
                weight,
                isExcl,
              ]
            );
            const pid = pRes.insertId;

            // productmedia — изображения (несколько через запятую или перевод строки)
            const imgUrls = imgRaw
              .split(/[,\r\n]+/)
              .map(u => u.trim())
              .filter(u => u && u.startsWith('http'));
            for (const url of imgUrls) {
              await conn.execute(
                'INSERT INTO productmedia (product_id, type, url) VALUES (?, "image", ?)',
                [pid, url.substring(0, 500)]
              );
            }

            // productmedia — видео (несколько через запятую или перевод строки)
            const videoUrls = videoRaw
              .split(/[,\r\n]+/)
              .map(u => u.trim())
              .filter(u => u && u.startsWith('http'));
            for (const url of videoUrls) {
              await conn.execute(
                'INSERT INTO productmedia (product_id, type, url) VALUES (?, "video", ?)',
                [pid, url.substring(0, 500)]
              );
            }

            // productspecifications (multi-row insert, пачки по 100)
            const specs = parseSpecs(specsRaw);
            for (let si = 0; si < specs.length; si += 100) {
              const chunk = specs.slice(si, si + 100);
              const ph = chunk.map(() => '(?,?,?,?)').join(',');
              await conn.query(
                `INSERT INTO productspecifications (product_id, name, value, unit) VALUES ${ph}`,
                chunk.flatMap(s => [pid, s.name, s.value, s.unit])
              );
            }

            // documents (разбиваем по запятой/переносу, затем multi-row insert)
            const docPairs = [
              [charUrl,  'чертеж'],
              [certUrl,  'сертификат'],
              [promoUrl, 'промо'],
              [instrUrl, 'инструкция'],
            ].flatMap(([raw, type]) =>
              raw
                .split(/[,\r\n]+/)
                .map(u => u.trim())
                .filter(u => u && u.startsWith('http'))
                .map(u => [u, type])
            );
            if (docPairs.length) {
              const ph = docPairs.map(() => '(?,?,?)').join(',');
              await conn.query(
                `INSERT INTO documents (product_id, type, url) VALUES ${ph}`,
                docPairs.flatMap(([u, t]) => [pid, t, u.substring(0, 500)])
              );
            }

            // prices
            await conn.execute(
              `INSERT INTO prices
               (product_id, supplier_id, branch_id, price, valid_from, valid_to)
               VALUES (?, ?, ?, ?, '2026-01-01', '2099-12-31')`,
              [pid, supplierId, branchSpbId, price]
            );

            // stock
            await conn.execute(
              'INSERT INTO stock (product_id, branch_id, quantity, updated_at) VALUES (?, ?, 10, NOW())',
              [pid, branchSpbId]
            );

            imported++;
          } catch (rowErr) {
            errors++;
            logErr(rowNum, rowErr.message);
          }
        }

        await conn.commit();
      } catch (batchErr) {
        await conn.rollback();
        console.error(`\n  Откат батча ${bStart}–${bStart + BATCH_SIZE}: ${batchErr.message}`);
      }

      // Прогресс
      const processed = Math.min(bStart + BATCH_SIZE, rows.length);
      const elapsed   = (Date.now() - startTime) / 1000;
      const speed     = elapsed > 0 ? Math.round(processed / elapsed) : 0;
      const remaining = rows.length - processed;
      const etaSec    = speed > 0 ? Math.round(remaining / speed) : 0;
      const etaMin    = Math.ceil(etaSec / 60);
      if (processed % 500 < BATCH_SIZE || processed === rows.length) {
        process.stdout.write(
          `\rОбработано ${processed}/${rows.length} | ${speed} стр/сек | осталось ~${etaMin} мин   `
        );
      }
    }

    // ── 11. Финальный отчёт ──────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n\n══════════════════════════════════════════');
    console.log('  Результат импорта');
    console.log('══════════════════════════════════════════');
    console.log(`  Брендов создано:        ${brandIdMap.size}`);
    console.log(`  Категорий создано:       ${catNodeMap.size}`);
    console.log(`  Товаров импортировано:   ${imported}`);
    console.log(`  Дубликатов пропущено:    ${skipped}`);
    console.log(`  Ошибок:                  ${errors}${errors ? ` (см. ${ERROR_LOG})` : ''}`);
    console.log(`  Время:                   ${elapsed} сек`);
    console.log('══════════════════════════════════════════');

  } finally {
    conn.release();
    errLog.end();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\nКритическая ошибка:', err.message);
  process.exit(1);
});
