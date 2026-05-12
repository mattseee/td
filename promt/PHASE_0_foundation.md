# ФАЗА 0 — ФУНДАМЕНТ ПРОЕКТА

> 📖 Полный контекст проекта: см. `MASTER.md` (общий промт). Этот файл — только Фаза 0.
> ⚠️ В этой фазе НЕ реализовывать бизнес-логику, страницы, API-роуты бизнеса. Только каркас.

---

## 🎯 ЦЕЛЬ ФАЗЫ

Создать пустой, но запускающийся проект:
- Структура папок `/frontend` + `/backend`
- Express запускается на порту 5000, отдаёт ping `/api/health`
- Next.js запускается на порту 3000, показывает заглушку
- Фронт умеет ходить на бэк (CORS работает)
- БД-пул подключается к MySQL (пустая БД пока подойдёт)
- Дизайн-токены (CSS-переменные) подключены, шрифты подгружены
- Базовый layout (Header-заглушка / Footer-заглушка)

После этой фазы: запускаешь оба сервера, открываешь `localhost:3000`, видишь дефолтную страницу с применёнными цветами/шрифтами и работающим запросом к `/api/health`.

---

## 🏗️ СТРУКТУРА ПРОЕКТА

```
/project
  /frontend              ← Next.js 14 (порт 3000)
  /backend               ← Express.js (порт 5000)
    /uploads             ← локальные фото товаров (создать пустую папку)
    .env
  README.md
```

---

## 🛠️ ТЕХНИЧЕСКИЙ СТЕК

### Frontend `/frontend`
```
Next.js 14 (App Router)
React 18
JavaScript (не TypeScript)
Tailwind CSS + CSS переменные
Framer Motion — анимации
Zustand — глобальный стейт
TanStack Query (React Query) — запросы к API
Axios — HTTP-клиент
React Hook Form — формы
js-cookie — работа с JWT-токеном
```

### Backend `/backend`
```
Node.js + Express.js
mysql2/promise — драйвер MySQL (pool соединений)
bcryptjs — хэширование паролей
jsonwebtoken — JWT авторизация
cors — разрешить запросы с localhost:3000
dotenv — переменные окружения
express.static — раздача папки /uploads
multer — загрузка файлов (для админки)
```

В этой фазе ставим ВСЕ зависимости, даже если используются позже — чтобы не возвращаться.

### `/backend/.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=products_db
DB_USER=root
DB_PASSWORD=
PORT=5000
JWT_SECRET=твой_секретный_ключ_минимум_32_символа
JWT_EXPIRES_IN=7d
```

### `/frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🔌 BACKEND — БАЗОВЫЙ КАРКАС

### `/backend/db.js`
```javascript
const mysql = require('mysql2/promise')
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10
})
module.exports = pool
// Использование: const [rows] = await pool.query('SELECT ...', [params])
// ВСЕГДА параметризованные запросы — никогда не конкатенировать строки в SQL
```

### `/backend/index.js`
```javascript
// 1. require dotenv в самом начале
// 2. express, cors, path
// 3. app.use(cors({ origin: 'http://localhost:3000' }))
// 4. app.use(express.json())
// 5. app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
//    Файл uploads/photo.jpg → http://localhost:5000/uploads/photo.jpg
// 6. app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }))
// 7. app.listen(PORT)
```

### Утилита изображений `/backend/utils/getImageUrl.js`
```javascript
function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url           // внешняя ссылка
  return `/uploads/${url}`                         // локальный файл
}
module.exports = { resolveImageUrl }
```

### Единый формат ответов API (закладываем сейчас, использовать во всех будущих роутах)
```javascript
// Успех:
{ success: true, data: { ... } }
{ success: true, data: [ ... ], total: 100, page: 1 }

// Ошибка:
{ success: false, error: 'Сообщение об ошибке' }

// HTTP-статусы: 200, 201, 400, 401, 403, 404, 500
```

---

## 🎨 FRONTEND — ДИЗАЙН-СИСТЕМА

### Философия
**Industrial Premium** — строгий, тёмный, профессиональный. Никакого дешёвого вида. Вдохновение: Festool, Bosch Professional, немецкий инструментальный брендинг.

### Цвета — `/frontend/src/app/globals.css`
```css
:root {
  --bg:           #0F1117;
  --surface:      #1A1D27;
  --surface-2:    #232736;
  --border:       #2E3347;
  --accent:       #F5A623;   /* янтарный — основной */
  --accent-2:     #E8520A;   /* оранжево-красный */
  --text:         #F0F2F8;
  --text-muted:   #7A8099;
  --success:      #2ECC8A;
  --danger:       #FF4D6D;
  --info:         #4D9EFF;
  --exclusive:    #9B6DFF;   /* бейдж «Эксклюзив» */
}

body {
  background: var(--bg);
  color: var(--text);
}
```

### Tailwind конфиг
В `tailwind.config.js` пробросить CSS-переменные в `theme.extend.colors`, чтобы можно было писать `bg-surface`, `text-accent`, `border-border` и т.д.

### Типографика (Google Fonts)
```
Заголовки:  Oswald (700, 600)
Текст:      Manrope (400, 500, 600)
Цены/коды:  JetBrains Mono (400, 600)
```
Подключить через `next/font/google` в root layout.

### Breakpoints
```
mobile:  < 768px
tablet:  768px – 1024px
desktop: > 1024px
wide:    > 1440px
```

### Заглушка изображения
Положить файл `/frontend/public/images/placeholder.jpg` (можно простой серый прямоугольник).

---

## 🛠️ FRONTEND — БАЗОВЫЕ УТИЛИТЫ

### `/frontend/src/utils/getImageUrl.js`
```javascript
export function getImageUrl(url) {
  if (!url) return '/images/placeholder.jpg'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`
}
// Использование: <img src={getImageUrl(product.mainImage)} alt={product.NAME} />
```

### `/frontend/src/utils/api.js`
Axios-инстанс с `baseURL = process.env.NEXT_PUBLIC_API_URL` и заготовкой interceptor для будущего JWT-токена (само добавление токена будет в Фазе 2, сейчас просто структура).

### `/frontend/src/utils/formatPrice.js`
Формат `1 234 ₽` (пробел между разрядами).

### `/frontend/src/utils/formatDate.js`
Формат `DD.MM.YYYY`.

### React Query Provider
В root layout обернуть приложение в `QueryClientProvider`.

---

## 🧱 FRONTEND — БАЗОВЫЙ LAYOUT

### `/frontend/src/app/layout.jsx` (root layout)
- HTML с подключёнными шрифтами
- `<QueryClientProvider>`
- Header-заглушка (просто логотип «СтройХаб» и пустые места под поиск/корзину/город)
- `{children}`
- Footer-заглушка (просто copyright)

### `/frontend/src/app/page.jsx` (главная-заглушка)
- Заголовок «СтройХаб»
- Тестовая кнопка «Проверить API» → делает запрос на `/api/health` → показывает результат в Toast или просто на странице
- Это нужно ТОЛЬКО для проверки, что фронт+бэк связаны

---

## 📦 README.md

В корне проекта создать `README.md` с инструкциями:
- Как создать БД `products_db` в phpMyAdmin
- Как заполнить `/backend/.env`
- `cd backend && npm install && npm run dev`
- `cd frontend && npm install && npm run dev`
- Проверка: открыть localhost:3000, нажать «Проверить API»

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ ФАЗЫ

1. `cd backend && npm run dev` запускается без ошибок, в логах — «Server running on port 5000»
2. Открыть `http://localhost:5000/api/health` → JSON `{ success: true, data: { status: 'ok' } }`
3. `cd frontend && npm run dev` запускается без ошибок
4. Открыть `http://localhost:3000` → видна заглушка с тёмным фоном (#0F1117), янтарным акцентом, шрифтом Oswald в заголовках
5. На странице кнопка «Проверить API» → клик → видно что бэк ответил (CORS работает)
6. БД пул в `db.js` инициализирован, при старте бэка нет ошибок подключения (БД пусть будет пустая, главное чтобы соединение установилось)

---

## 🚫 ЧТО НЕ ДЕЛАЕМ В ЭТОЙ ФАЗЕ

- НЕ создаём таблицы БД (это Фаза 1)
- НЕ пишем бизнес-роуты (`/api/products`, `/api/auth` и т.д.)
- НЕ делаем настоящий Header с поиском/мегаменю — только заглушку
- НЕ верстаем страницы каталога/товара/корзины
- НЕ настраиваем авторизацию

---

## 🚫 ОБЩИЕ ЗАПРЕТЫ ПРОЕКТА (соблюдать с Фазы 0)

- НЕ использовать готовые UI-библиотеки (MUI, Ant, Chakra, shadcn)
- НЕ использовать TypeScript (проект на JavaScript)
- НЕ конкатенировать строки в SQL-запросах (всегда параметризованные)
- НЕ хранить JWT в localStorage (только cookie)
- НЕ использовать `alert()` — только Toast-уведомления (Toast делаем в Фазе 3)
