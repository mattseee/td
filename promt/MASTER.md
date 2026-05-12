# ПРОМТ ДЛЯ CLAUDE CODE — v3.0 (ФИНАЛЬНЫЙ)
## Строительный маркетплейс «СтройХаб»
### Next.js (фронтенд) + Express.js (бэкенд) + MySQL

---

## 🎯 ОБЩАЯ ЗАДАЧА

Разработай полноценный строительный маркетплейс. Два отдельных приложения:
- `/frontend` — Next.js 14 (App Router), весь UI
- `/backend` — Express.js, API к MySQL БД, раздача фото

Аудитория: частные покупатели, прорабы, строительные компании (B2C + B2B).

---

## 🏗️ СТРУКТУРА ПРОЕКТА

```
/project
  /frontend              ← Next.js 14 (порт 3000)
  /backend               ← Express.js (порт 5000)
    /uploads             ← локальные фото товаров
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

## 🗄️ ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ

### Товарная часть (products_db)

```sql
products_db.brands
  brand_id    INT(11) PK
  NAME        VARCHAR(255)

products_db.categories
  category_id INT(11) PK
  NAME        VARCHAR(255)
  parent_id   INT(11) NULL FK → categories.category_id

products_db.suppliers
  supplier_id  INT(11) PK
  NAME         VARCHAR(255)
  contact_info TEXT

products_db.branches
  branch_id    INT(11) PK
  NAME         VARCHAR(255)
  city         VARCHAR(255)
  address      VARCHAR(500)
  contact_info TEXT

products_db.products
  product_id    INT(11) PK
  supplier_id   INT(11) FK → suppliers
  category_id   INT(11) FK → categories
  brand_id      INT(11) FK → brands
  sku           VARCHAR(100)
  NAME          VARCHAR(255)
  description   TEXT
  hs_code       VARCHAR(50)
  power_cold    DECIMAL(10,2) NULL   -- мощность охлаждения
  power_heat    DECIMAL(10,2) NULL   -- мощность обогрева
  size_internal VARCHAR(50)   NULL   -- габариты внутр. блока
  size_external VARCHAR(50)   NULL   -- габариты внеш. блока
  air_flow      DECIMAL(10,2) NULL   -- воздухообмен
  weight        DECIMAL(10,2) NULL
  is_exclusive  TINYINT(1) DEFAULT 0

products_db.prices
  price_id        INT(11) PK
  product_id      INT(11) FK → products
  supplier_id     INT(11) FK → suppliers
  branch_id       INT(11) FK → branches
  price           DECIMAL(15,2)
  discount_price  DECIMAL(15,2) NULL
  valid_from      DATE
  valid_to        DATE

products_db.stock
  stock_id    INT(11) PK
  product_id  INT(11) FK → products
  branch_id   INT(11) FK → branches
  quantity    INT(11)
  updated_at  DATETIME

products_db.productmedia
  media_id    INT(11) PK
  product_id  INT(11) FK → products
  TYPE        ENUM('image','video','doc')
  url         VARCHAR(500)
  -- ВАЖНО: url может быть внешней ссылкой (https://...) 
  -- или именем локального файла (photo.jpg)

products_db.productspecifications
  spec_id     INT(11) PK
  product_id  INT(11) FK → products
  NAME        VARCHAR(255)
  VALUE       VARCHAR(255)
  unit        VARCHAR(50)

products_db.relatedproducts
  id             INT(11) PK
  product_id     INT(11) FK → products
  related_id     INT(11) FK → products
  relation_type  ENUM('сопутствующий','аналог')

products_db.promotions
  promotion_id  INT(11) PK
  NAME          VARCHAR(255)
  description   TEXT
  valid_from    DATE
  valid_to      DATE

products_db.productpromotions
  id            INT(11) PK
  product_id    INT(11) FK → products
  promotion_id  INT(11) FK → promotions
  promo_price   DECIMAL(15,2)

products_db.documents
  document_id  INT(11) PK
  product_id   INT(11) FK → products
  TYPE         VARCHAR(100)
  url          VARCHAR(500)

products_db.reviews
  review_id   INT(11) PK
  product_id  INT(11) FK → products
  user_name   VARCHAR(255)
  rating      TINYINT(4)
  COMMENT     TEXT
  created_at  DATETIME
```

### Пользовательская часть

```sql
Users
  user_id       INT AUTO_INCREMENT PK
  email         VARCHAR(255) NOT NULL UNIQUE
  password_hash VARCHAR(255) NOT NULL
  name          VARCHAR(255)
  phone         VARCHAR(50)
  role          ENUM('user','admin') DEFAULT 'user'
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP

Addresses
  address_id  INT AUTO_INCREMENT PK
  user_id     INT NOT NULL FK → Users(user_id) ON DELETE CASCADE
  city        VARCHAR(255)
  address     VARCHAR(500)
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP

Orders
  order_id    INT AUTO_INCREMENT PK
  user_id     INT NOT NULL FK → Users(user_id) ON DELETE CASCADE
  status      ENUM('pending','processing','completed','cancelled') DEFAULT 'pending'
  total       DECIMAL(15,2) DEFAULT 0
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP

OrderItems
  order_item_id  INT AUTO_INCREMENT PK
  order_id       INT NOT NULL FK → Orders(order_id) ON DELETE CASCADE
  product_id     INT NOT NULL FK → Products(product_id) ON DELETE CASCADE
  quantity       INT DEFAULT 1
  price          DECIMAL(15,2) NOT NULL  -- цена зафиксированная на момент заказа

-- Индексы:
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_orderitems_order ON OrderItems(order_id);
CREATE INDEX idx_orderitems_product ON OrderItems(product_id);
```

---

## 🖼️ ОБРАБОТКА ИЗОБРАЖЕНИЙ

В `productmedia.url` два формата — обрабатывать везде через одну утилиту:

### Backend (`/backend/utils/getImageUrl.js`)
```javascript
function resolveImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url           // внешняя ссылка
  return `/uploads/${url}`                         // локальный файл
}
module.exports = { resolveImageUrl }
```

Применять при формировании ответов API — чтобы фронтенд всегда получал готовый url.

### Express статика (`/backend/index.js`)
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// Файл uploads/photo.jpg → http://localhost:5000/uploads/photo.jpg
```

### Frontend (`/frontend/src/utils/getImageUrl.js`)
```javascript
export function getImageUrl(url) {
  if (!url) return '/images/placeholder.jpg'
  if (url.startsWith('http')) return url
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`
}
// Использование: <img src={getImageUrl(product.mainImage)} alt={product.NAME} />
```

Положи файл-заглушку: `/frontend/public/images/placeholder.jpg`

---

## 🔐 АВТОРИЗАЦИЯ

### Схема работы
```
Регистрация:
  POST /api/auth/register
  body: { email, password, name, phone }
  → хэшировать пароль bcrypt (saltRounds: 10)
  → сохранить в Users
  → вернуть JWT токен

Вход:
  POST /api/auth/login
  body: { email, password }
  → сравнить bcrypt.compare
  → вернуть JWT токен + данные пользователя (без password_hash)

Проверка токена:
  GET /api/auth/me
  header: Authorization: Bearer <token>
  → вернуть данные текущего пользователя

JWT payload:
  { user_id, email, role }
```

### Middleware для защищённых роутов (`/backend/middleware/auth.js`)
```javascript
// authMiddleware — проверяет JWT, добавляет req.user
// adminMiddleware — проверяет req.user.role === 'admin'
```

### Frontend — хранение токена
```javascript
// Хранить JWT в httpOnly cookie через js-cookie
// Zustand store authStore:
{
  user: null,          // { user_id, email, name, role }
  token: null,
  isAuthenticated: false,
  login: (user, token) => void,
  logout: () => void
}
// При каждом запросе Axios добавляет токен через interceptor
```

---

## 🛒 КОРЗИНА

Корзина хранится в **localStorage** (не в БД). При оформлении заказа — данные из корзины отправляются на сервер.

```javascript
// Zustand cartStore (с persist в localStorage):
{
  items: [
    {
      product_id: number,
      name: string,
      sku: string,
      image: string | null,
      price: number,          // цена на момент добавления
      quantity: number,
      branch_id: number       // филиал цены
    }
  ],
  addItem: (product, quantity) => void,
  removeItem: (product_id) => void,
  updateQuantity: (product_id, quantity) => void,
  clearCart: () => void,
  // геттеры:
  totalItems: number,
  totalPrice: number
}
```

---

## 🔌 BACKEND API РОУТЫ

### Все роуты с базовым путём `/api`

```
AUTH
  POST   /api/auth/register        — регистрация
  POST   /api/auth/login           — вход
  GET    /api/auth/me              — [authMiddleware] данные текущего пользователя

ТОВАРЫ
  GET    /api/products             — список товаров (с фильтрами)
    query: category_id, brand_id, supplier_id, branch_id, city,
           in_stock, is_exclusive, price_min, price_max,
           sort (price_asc|price_desc|rating|newest),
           page, limit, q (поиск)
  GET    /api/products/:id         — полный товар (JOIN все таблицы)
  GET    /api/products/:id/related — связанные (?type=сопутствующий|аналог|all)
  GET    /api/products/:id/reviews — отзывы (?sort=newest|rating_high)
  POST   /api/products/:id/reviews — добавить отзыв (user_name, rating, COMMENT)

КАТЕГОРИИ
  GET    /api/categories           — дерево категорий (с parent_id)
  GET    /api/categories/:id       — категория + хлебные крошки

БРЕНДЫ
  GET    /api/brands               — все бренды
  GET    /api/brands/:id           — бренд + его товары

ФИЛИАЛЫ
  GET    /api/branches             — все филиалы (?city=)
  GET    /api/branches/cities      — список уникальных городов

ПОСТАВЩИКИ
  GET    /api/suppliers            — все поставщики

АКЦИИ
  GET    /api/promotions           — все акции (?active=true — только текущие)
  GET    /api/promotions/:id       — акция + товары

ЦЕНЫ И НАЛИЧИЕ
  GET    /api/prices?product_id=&branch_id=   — цены товара
  GET    /api/stock?product_id=&city=         — остатки по городу

ПОИСК
  GET    /api/search?q=&limit=     — поиск по товарам, категориям, брендам

ЛИЧНЫЙ КАБИНЕТ [authMiddleware]
  GET    /api/account/orders           — заказы пользователя
  GET    /api/account/orders/:id       — детали заказа
  POST   /api/account/orders           — создать заказ (из корзины)
  GET    /api/account/addresses        — адреса пользователя
  POST   /api/account/addresses        — добавить адрес
  DELETE /api/account/addresses/:id    — удалить адрес
  PUT    /api/account/profile          — обновить профиль (name, phone)
  PUT    /api/account/password         — сменить пароль

АДМИН-ПАНЕЛЬ [authMiddleware + adminMiddleware]
  GET    /api/admin/stats              — статистика (товары, заказы, пользователи)
  
  GET    /api/admin/products           — все товары (расширенный список)
  POST   /api/admin/products           — создать товар
  PUT    /api/admin/products/:id       — редактировать товар
  DELETE /api/admin/products/:id       — удалить товар
  POST   /api/admin/products/:id/media — загрузить фото (multer)
  DELETE /api/admin/media/:id          — удалить медиафайл

  GET    /api/admin/orders             — все заказы (?status=)
  PUT    /api/admin/orders/:id/status  — сменить статус заказа

  GET    /api/admin/users              — все пользователи
  PUT    /api/admin/users/:id/role     — сменить роль пользователя

  GET    /api/admin/categories         — управление категориями
  POST   /api/admin/categories
  PUT    /api/admin/categories/:id
  DELETE /api/admin/categories/:id

  GET    /api/admin/promotions         — управление акциями
  POST   /api/admin/promotions
  PUT    /api/admin/promotions/:id
  DELETE /api/admin/promotions/:id
```

### Структура ответа API (единый формат)
```javascript
// Успех:
{ success: true, data: { ... } }
{ success: true, data: [ ... ], total: 100, page: 1 }

// Ошибка:
{ success: false, error: 'Сообщение об ошибке' }

// Все роуты оборачивать в try/catch, возвращать правильные HTTP-статусы:
// 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized,
// 403 Forbidden, 404 Not Found, 500 Internal Server Error
```

### Подключение к БД (`/backend/db.js`)
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

---

## 💰 ЛОГИКА ЦЕН (ВАЖНО)

Цена зависит от филиала (branch_id) и имеет даты действия. Приоритет:
**promo_price > discount_price > price**

```javascript
// /backend/utils/pricing.js

function getEffectivePrice(prices, productPromotions, promotions, branchId) {
  const today = new Date()

  // 1. Цена для конкретного филиала с действующими датами
  const branchPrice = prices.find(p =>
    p.branch_id === branchId &&
    new Date(p.valid_from) <= today &&
    new Date(p.valid_to) >= today
  )
  if (!branchPrice) return null

  // 2. Активная промо-акция
  const activePromo = productPromotions
    .map(pp => ({
      pp,
      promo: promotions.find(pr =>
        pr.promotion_id === pp.promotion_id &&
        new Date(pr.valid_from) <= today &&
        new Date(pr.valid_to) >= today
      )
    }))
    .find(({ promo }) => promo != null)

  const original = branchPrice.price

  if (activePromo?.promo) {
    return {
      finalPrice: activePromo.pp.promo_price,
      originalPrice: original,
      promoName: activePromo.promo.NAME,
      discountPercent: Math.round((1 - activePromo.pp.promo_price / original) * 100),
      priceType: 'promo'
    }
  }

  if (branchPrice.discount_price && branchPrice.discount_price < original) {
    return {
      finalPrice: branchPrice.discount_price,
      originalPrice: original,
      promoName: null,
      discountPercent: Math.round((1 - branchPrice.discount_price / original) * 100),
      priceType: 'discount'
    }
  }

  return {
    finalPrice: original,
    originalPrice: original,
    promoName: null,
    discountPercent: 0,
    priceType: 'regular'
  }
}

module.exports = { getEffectivePrice }
```

---

## 🎨 ДИЗАЙН-СИСТЕМА

### Философия
**Industrial Premium** — строгий, тёмный, профессиональный. Никакого дешёвого вида. Вдохновение: Festool, Bosch Professional, немецкий инструментальный брендинг.

### Цвета (CSS переменные в `globals.css`)
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
```

### Типографика (Google Fonts)
```
Заголовки:  Oswald (700, 600)
Текст:      Manrope (400, 500, 600)
Цены/коды:  JetBrains Mono (400, 600)
```

### Breakpoints
```
mobile:  < 768px
tablet:  768px – 1024px
desktop: > 1024px
wide:    > 1440px
```

---

## 📄 СТРАНИЦЫ ФРОНТЕНДА

### `/` — Главная
- Hero-слайдер (данные из активных `promotions`)
- Быстрые категории (корневые: `parent_id IS NULL`)
- Хиты продаж (товары с высоким рейтингом)
- **Калькулятор материалов** (ФИЧА #1)
- Активные акции
- Эксклюзивные товары (`is_exclusive = 1`)
- **Мастер недели** (ФИЧА #2)
- Карусель брендов

### `/catalog/[[...slug]]` — Каталог
```
URL: /catalog → все товары
     /catalog/roofing → категория
     /catalog/roofing/metal → подкатегория

Сайдбар фильтров:
  - Категории (дерево из /api/categories)
  - Бренды (мультивыбор с поиском)
  - Цена (range-slider с гистограммой)
  - Наличие
  - Динамические из productspecifications
    (уникальные NAME для категории → чекбоксы или range)
  - Для климатики: power_cold, power_heat, air_flow (range)
  - Только эксклюзивные (чекбокс)

Основной контент:
  - Хлебные крошки
  - Сортировка: популярные/цена↑/цена↓/рейтинг/новинки
  - Вид: сетка (3/4 колонки) / список
  - Карточки товаров
  - Пагинация
```

### `/product/[id]` — Карточка товара
```
Левая колонка:
  - Галерея: images из productmedia (TYPE='image')
  - Видео если TYPE='video'
  - Документы-превью если TYPE='doc'
  - Бейджи: Эксклюзив (is_exclusive=1), % скидки, Акция

Правая колонка:
  - Бренд → /brands/[id]
  - Название (H1)
  - SKU + кнопка «Скопировать»
  - Рейтинг + количество отзывов
  - ЦЕНА (через getEffectivePrice для выбранного города):
    → promo: старая цена зачёркнута + бейдж акции + новая цена
    → discount: старая зачёркнута + новая + % скидки
    → regular: просто цена
    → нет города: «Выберите город для отображения цены»
  - Наличие по городу (из /api/stock):
    → «В наличии в 3 магазинах» → клик → список филиалов с адресами
    → «Осталось 3 шт» (если quantity <= 5)
    → «Нет в наличии» + «Сообщить о поступлении»
  - Степпер количества + «В корзину»
  - Кнопки: «В избранное», «Сравнить», «Поделиться»

Табы:
  1. Описание — description
  2. Характеристики:
     - Фиксированные (weight, power_cold, power_heat,
       size_internal, size_external, air_flow — только если не null)
     - Динамические из productspecifications
  3. Документы — из таблицы documents (TYPE, url)
     + productmedia где TYPE='doc'
  4. Отзывы — список + форма добавления
     Фильтр по звёздам | Гистограмма рейтингов
  5. Доставка — список branches с количеством из stock

Блок «Сопутствующие товары»:
  - relatedproducts WHERE relation_type='сопутствующий'
  - Горизонтальный скролл + чекбоксы + «Добавить выбранное»

Блок «Аналоги»:
  - relatedproducts WHERE relation_type='аналог'
  - Горизонтальный скролл + кнопка «Сравнить»
```

### `/cart` — Корзина (localStorage)
```
Список товаров из cartStore:
  - Фото, название, SKU, цена, степпер, итого, удалить

Правая панель:
  - Промокод (UI без реальной логики, заглушка)
  - Сумма / скидка / итого
  - «Оформить заказ» → только для авторизованных
    (незалогиненный → модалка «Войдите чтобы оформить заказ»)

ФИЧА «Проверка комплектности»:
  - Кнопка «Проверить комплектность»
  - Анализирует category_id товаров в корзине
  - Предупреждает о возможных недостающих товарах
```

### `/checkout` — Оформление заказа `[authMiddleware на фронте]`
```
Шаг 1 — Доставка:
  - Список сохранённых адресов пользователя (из /api/account/addresses)
  - Форма добавления нового адреса
  - Выбор филиала для самовывоза

Шаг 2 — Подтверждение:
  - Список товаров из корзины (только просмотр)
  - Итоговая сумма
  - «Оформить заказ» →
    POST /api/account/orders с { items, address, total }
    → очистить корзину (cartStore.clearCart())
    → редирект на /account/orders

Итоговая страница /order/success:
  - «Заказ №X оформлен»
  - Кнопка «Перейти в мои заказы»
```

### `/account/*` — Личный кабинет `[только авторизованные]`

```
/account               — дашборд: последние заказы, данные профиля
/account/orders        — список всех заказов
/account/orders/[id]   — детали заказа:
                          статус (pending/processing/completed/cancelled)
                          список товаров с ценами
                          адрес доставки
/account/addresses     — мои адреса: список + добавить + удалить
/account/profile       — редактирование: имя, телефон, email
                         смена пароля (старый + новый + подтверждение)
/account/favorites     — избранное (из localStorage favoritesStore)
/account/projects      — ФИЧА #5 «Мои проекты»
```

### `/account/projects` — Мои Проекты (ФИЧА #5)
```
Хранение: localStorage (projectsStore в Zustand)
Структура проекта:
{
  id: string (uuid)
  name: string
  type: 'repair' | 'construction' | 'dacha' | 'commercial'
  budget: number
  items: [{
    product_id, name, image, quantity_planned,
    quantity_bought, price_fixed, status,
    status: 'planned'|'in_cart'|'purchased'|'cancelled'
  }]
  shareToken: string
  createdAt: string
}

На карточке товара: кнопка «+ В проект» → выпадающий список проектов
Страница проекта: смета план/факт + круговая диаграмма расходов
Публичная ссылка: /project/[shareToken] (только просмотр)
```

### `/auth/login` и `/auth/register`
```
Дизайн: полноэкранные страницы с брендированием
Логин: email + пароль + «Запомнить меня»
Регистрация: имя + email + телефон + пароль + подтверждение пароля
Валидация React Hook Form:
  - email: формат email
  - password: минимум 8 символов
  - phone: российский формат
После успеха: токен в cookie + редирект на /account
```

### `/admin/*` — Админ-панель `[только role='admin']`

```
/admin                       — дашборд со статистикой
/admin/products              — список товаров (таблица с поиском)
/admin/products/new          — форма создания товара
/admin/products/[id]/edit    — форма редактирования товара
/admin/orders                — все заказы (фильтр по статусу)
/admin/orders/[id]           — детали + смена статуса
/admin/users                 — список пользователей
/admin/categories            — управление категориями
/admin/promotions            — управление акциями
```

#### Дашборд `/admin` (статистика)
```
Карточки:
  - Всего товаров (COUNT products)
  - Заказов сегодня (COUNT orders WHERE DATE(created_at) = TODAY)
  - Заказов за месяц
  - Выручка за месяц (SUM total WHERE status='completed')
  - Новых пользователей за месяц

Таблица последних 10 заказов:
  №заказа | Пользователь | Сумма | Статус | Дата
```

#### Форма товара (create/edit)
```
Основное:
  - Название (NAME)
  - Категория (выпадающий список из categories)
  - Бренд (выпадающий список из brands)
  - Поставщик (выпадающий список из suppliers)
  - SKU (артикул)
  - Описание (textarea)
  - hs_code
  - Вес
  - is_exclusive (чекбокс)

Технические характеристики (показывать всегда):
  - power_cold, power_heat, size_internal, size_external, air_flow

Характеристики (productspecifications):
  - Динамический список строк: NAME + VALUE + UNIT
  - Кнопка «Добавить характеристику»

Медиафайлы:
  - Загрузка фото (multer → сохранить в /backend/uploads)
  - Список существующих медиа с кнопками удаления
  - Поле для добавления внешней ссылки на фото/видео

Цены (по филиалам):
  - Таблица: Филиал | Цена | Скидочная цена | Дата от | Дата до
  - Кнопка «Добавить цену для филиала»
```

---

## 🌟 УНИКАЛЬНЫЕ ФИЧИ

### ФИЧА #1 — Калькулятор материалов (`/calculator`)
```
Типы расчётов с конфигами в /frontend/src/data/calculator.js:
  - Укладка плитки → клей, затирка, грунтовка, крестики
  - Штукатурка стен → смесь, грунт, маяки
  - Кровля → материал, крепёж, уплотнитель
  - Стяжка → смесь, сетка
  - Покраска → краска, грунт, кисти/валик

Пользователь вводит параметры → система считает количество каждого материала
→ находит товары через /api/products?category_id=X&q=Y
→ пользователь выбирает конкретный товар из предложенных
→ «Добавить всё в корзину» | «Сохранить в проект»
```

### ФИЧА #2 — Мастер недели
```
Данные: /frontend/src/data/masters.js (статика)
Поля: name, city, specialty, photo, project { title, before, after },
      usedProducts: [product_id, ...], tips: []

На главной — карточка + ссылка на /masters
Страница /masters — все мастера
Товары подгружаются через API по product_id
```

### ФИЧА #3 — Smart Bundle (данные из relatedproducts)
```
На карточке товара — блок «Сопутствующие товары»
API: /api/products/:id/related?type=сопутствующий
UI: горизонтальный скролл + чекбоксы + живой пересчёт + «Добавить выбранное»
```

### ФИЧА #4 — Проверка комплектности корзины
```
/frontend/src/data/compatibility.js — матрица:
{
  categoryId_X: {           // если в корзине есть товар этой категории
    requires: [categoryId_Y, categoryId_Z],   // то нужны товары этих категорий
    messages: ['Не забудьте подложку', 'Нужны порожки']
  }
}
Кнопка в корзине → попап с предупреждениями + кнопки «Найти товар»
```

### ФИЧА #5 — Мои Проекты
```
Описание выше в разделе /account/projects
Ключевые экраны:
  - Список проектов (карточки с прогрессом бюджета)
  - Детали проекта: смета таблицей + диаграмма расходов
  - Публичная страница /project/[token] — только просмотр
```

---

## 🧩 КОМПОНЕНТЫ ФРОНТЕНДА

```
/frontend/src/
  components/
    ui/
      Button.jsx           — варианты: primary, secondary, ghost, danger
      Input.jsx            — с label, error, иконкой
      Modal.jsx            — портал, backdrop click, Escape
      Drawer.jsx           — выдвигается снизу (mobile) или сбоку
      Toast.jsx            — уведомления (success/error/info), очередь
      Skeleton.jsx         — заглушки загрузки (не спиннер!)
      Badge.jsx            — бейджи товаров
      RangeSlider.jsx      — двойной слайдер для цен
      Pagination.jsx
      RatingStars.jsx
      Stepper.jsx          — счётчик количества товара
    layout/
      Header.jsx           — шапка с поиском, городом, корзиной
      Footer.jsx
      MegaMenu.jsx         — каталог-дерево с подкатегориями
      BottomNav.jsx        — нижняя навигация на мобиле
      CitySelector.jsx     — выбор города
    product/
      ProductCard.jsx      — карточка в листинге
      ProductGallery.jsx   — галерея на карточке товара
      PriceBlock.jsx       — отображение цены (promo/discount/regular)
      StockBadge.jsx       — статус наличия
      SpecsTable.jsx       — таблица характеристик
      ReviewsList.jsx      — список отзывов + форма
      RelatedProducts.jsx  — сопутствующие + аналоги
    catalog/
      FilterSidebar.jsx    — все фильтры
      ActiveFilters.jsx    — теги активных фильтров с крестиками
      ProductGrid.jsx      — сетка / список
      SortBar.jsx
    cart/
      CartItem.jsx
      CartSummary.jsx
      CompletenessCheck.jsx — ФИЧА #4
    auth/
      LoginForm.jsx
      RegisterForm.jsx
      ProtectedRoute.jsx   — редирект незалогиненных
      AdminRoute.jsx       — редирект не-админов
    admin/
      AdminLayout.jsx      — сайдбар + header для админки
      StatsCard.jsx
      DataTable.jsx        — таблица с сортировкой и поиском
      ProductForm.jsx      — форма товара
      OrderStatusBadge.jsx
    account/
      OrderCard.jsx
      AddressCard.jsx
      ProjectCard.jsx
  
  store/
    authStore.js           — user, token, isAuthenticated
    cartStore.js           — items (persist localStorage)
    favoritesStore.js      — product_ids (persist localStorage)
    compareStore.js        — до 4 товаров одной категории
    cityStore.js           — выбранный город + branch_ids
    projectsStore.js       — Мои проекты (persist localStorage)
    uiStore.js             — модалки, дроуеры, toast очередь

  hooks/
    useAuth.js             — удобный доступ к authStore
    useCart.js             — удобный доступ к cartStore
    useDebounce.js
    useIntersectionObserver.js  — для lazy-loading анимаций

  utils/
    getImageUrl.js         — обработка url фото (описано выше)
    formatPrice.js         — «1 234 ₽»
    formatDate.js          — DD.MM.YYYY
    api.js                 — Axios instance с baseURL и interceptors

  data/
    calculator.js          — конфиги расчётов
    compatibility.js       — матрица совместимости категорий
    masters.js             — данные мастеров недели
```

---

## ♿ КАЧЕСТВО

- Все async/await в try/catch (и на фронте и на бэке)
- Скелетоны вместо спиннеров при загрузке
- Понятные пустые состояния с иконкой и CTA
- Понятные сообщения об ошибках через Toast
- Параметризованные SQL-запросы везде (никогда не конкатенировать!)
- CORS только для нужных origins
- Пароли только через bcrypt, никогда не возвращать password_hash в ответах API
- JWT токен проверять на каждом защищённом роуте

---

## 📱 МОБИЛЬНАЯ АДАПТАЦИЯ

- Bottom navigation bar (мобиле): Главная / Каталог / Поиск / Корзина / Аккаунт
- Фильтры каталога: bottom sheet drawer
- Мегаменю: fullscreen drawer с аккордеоном
- Touch targets: минимум 44×44px
- Горизонтальный скролл карточек вместо сетки на mobile

---

## 🌍 ЛОКАЛИЗАЦИЯ

- Язык: русский
- Валюта: ₽, формат `1 234 ₽` (функция `formatPrice`)
- Даты: DD.MM.YYYY
- Телефоны: +7 (___) ___-__-__
- Единицы: метрическая система

---

## ✅ ПОРЯДОК РАЗРАБОТКИ

1. **Backend основа** — `db.js`, `index.js`, CORS, статика `/uploads`
2. **Auth API** — register, login, middleware
3. **Товарные API** — products, categories, brands, search
4. **Дизайн-система** — CSS переменные, базовые компоненты
5. **Layout** — Header (CitySelector, поиск, корзина), Footer, MegaMenu
6. **Главная страница**
7. **Каталог + фильтры**
8. **Карточка товара**
9. **Авторизация** — страницы login/register, authStore, ProtectedRoute
10. **Корзина + Оформление заказа**
11. **Личный кабинет** — заказы, адреса, профиль
12. **Уникальные фичи** — Калькулятор, Smart Bundle, Проверка комплектности, Мои проекты
13. **Админ-панель** — дашборд, товары, заказы, пользователи
14. **Мобильная адаптация + полировка**

---

## 🚫 ЗАПРЕТЫ

- НЕ использовать готовые UI-библиотеки (MUI, Ant, Chakra, shadcn)
- НЕ использовать TypeScript (проект на JavaScript)
- НЕ придумывать поля которых нет в схеме БД
- НЕ конкатенировать строки в SQL-запросах
- НЕ возвращать `password_hash` в ответах API никогда
- НЕ хранить JWT в localStorage (только cookie)
- НЕ делать фиктивные кнопки — всё работает хотя бы на уровне mock-ответа
- НЕ использовать `alert()` — только Toast-уведомления

---

*Схема БД — products_db в MySQL/phpMyAdmin. Фронтенд — Next.js на порту 3000. Бэкенд — Express на порту 5000. Локальные фото — в /backend/uploads/, раздаются как статика.*
