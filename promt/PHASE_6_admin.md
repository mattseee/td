# ФАЗА 6 — АДМИН-ПАНЕЛЬ

> 📖 Полный контекст: `MASTER.md`. Фазы 0–5 должны быть выполнены.

---

## 🎯 ЦЕЛЬ ФАЗЫ

Полноценная админ-панель для пользователя с `role='admin'`:
- `/admin` — дашборд со статистикой
- `/admin/products` — CRUD товаров (включая загрузку фото)
- `/admin/orders` — все заказы, смена статуса
- `/admin/users` — список пользователей, смена роли
- `/admin/categories` — CRUD категорий
- `/admin/promotions` — CRUD акций

Все роуты защищены `authMiddleware + adminMiddleware`.
Все страницы фронта обёрнуты в `<AdminRoute>`.

---

## 🔌 ШАГ 6.1 — BACKEND API (админ)

Все роуты префикса `/api/admin/*` требуют `[authMiddleware + adminMiddleware]`.

```
СТАТИСТИКА
  GET /api/admin/stats
    → {
        totalProducts: COUNT products,
        ordersToday: COUNT orders WHERE DATE(created_at) = CURDATE(),
        ordersMonth: COUNT orders WHERE created_at >= start of month,
        revenueMonth: SUM total WHERE status='completed' AND created_at >= start of month,
        newUsersMonth: COUNT users WHERE created_at >= start of month,
        recentOrders: последние 10 заказов с email пользователя
      }

ТОВАРЫ
  GET    /api/admin/products              — расширенный список (с админскими полями)
    query: q, category_id, page, limit
  POST   /api/admin/products              — создать товар
  PUT    /api/admin/products/:id          — редактировать
  DELETE /api/admin/products/:id          — удалить (CASCADE на media, prices, stock)
  POST   /api/admin/products/:id/media    — загрузить фото (multer → /backend/uploads)
  POST   /api/admin/products/:id/media-url — добавить внешнюю ссылку как media (без файла)
  DELETE /api/admin/media/:id             — удалить media-запись (если локальный файл — fs.unlink)

  POST/PUT тело товара включает:
    - basic: NAME, sku, description, hs_code, weight, is_exclusive,
             category_id, brand_id, supplier_id
    - climatic (NULL допускается): power_cold, power_heat, size_internal,
             size_external, air_flow
    - specifications: [{ NAME, VALUE, unit }, ...]
    - prices: [{ branch_id, price, discount_price, valid_from, valid_to }, ...]
    Примечание: specifications и prices обновляются полным replace
    (сначала DELETE по product_id, потом INSERT новых) — ОБЯЗАТЕЛЬНО в транзакции.

ЗАКАЗЫ
  GET /api/admin/orders?status=          — все заказы (с email пользователя)
  PUT /api/admin/orders/:id/status       — body: { status }, возвращает обновлённый заказ

ПОЛЬЗОВАТЕЛИ
  GET /api/admin/users?q=                — список (без password_hash!)
  PUT /api/admin/users/:id/role          — body: { role: 'user'|'admin' }
    Запрет: админ не может понизить себя (req.user.user_id === :id && role='user' → 400)

КАТЕГОРИИ
  GET    /api/admin/categories           — плоский список (с parent_id)
  POST   /api/admin/categories           — body: { NAME, parent_id }
  PUT    /api/admin/categories/:id       — обновить
  DELETE /api/admin/categories/:id       — удалить
    Запрет: если есть дочерние категории или товары — 400 «Сначала удалите содержимое»

АКЦИИ
  GET    /api/admin/promotions           — все акции
  POST   /api/admin/promotions           — { NAME, description, valid_from, valid_to }
  PUT    /api/admin/promotions/:id
  DELETE /api/admin/promotions/:id
  POST   /api/admin/promotions/:id/products  — body: { product_id, promo_price }
  DELETE /api/admin/promotions/:promoId/products/:productId
```

### Multer-конфигурация для загрузки фото

```javascript
// /backend/middleware/upload.js
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${unique}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  }
})

module.exports = upload
```

В роуте `POST /api/admin/products/:id/media`:
```javascript
router.post('/products/:id/media', authMiddleware, adminMiddleware,
  upload.single('file'), async (req, res) => {
    // INSERT в productmedia: TYPE='image', url = req.file.filename
    // Вернуть { success, data: { media_id, url: resolveImageUrl(req.file.filename) } }
  })
```

---

## 🎨 ШАГ 6.2 — FRONTEND: AdminLayout

```
AdminLayout (layout для /admin/*):
  - Сайдбар:
    Дашборд / Товары / Заказы / Пользователи / Категории / Акции
    Внизу: «← На сайт» + имя текущего админа + Logout
  - Topbar: breadcrumbs + быстрые действия (например, «+ Новый товар» когда на /admin/products)
  - Основной контент
  - Обёрнут в <AdminRoute>
  - Темы: можно оставить тёмную industrial, или сделать светлую для админки (на твой выбор;
    если сомневаешься — оставляй тёмную для консистентности)
```

---

## 🎨 ШАГ 6.3 — `/admin` (дашборд)

```
- 5 StatsCard в ряд (на мобиле — колонкой):
  - Всего товаров
  - Заказов сегодня
  - Заказов за месяц
  - Выручка за месяц (formatPrice)
  - Новых пользователей за месяц
- Таблица последних 10 заказов:
  №заказа | Пользователь (email) | Сумма | OrderStatusBadge | Дата
  Клик по строке → /admin/orders/[id]
```

---

## 🎨 ШАГ 6.4 — `/admin/products` (список и CRUD)

### Список `/admin/products`
- DataTable:
  - Колонки: Фото | NAME | SKU | Категория | Бренд | Цена (минимальная активная) | Действия
  - Поиск по NAME / SKU
  - Фильтр по категории
  - Пагинация
  - Действия: «Редактировать» (→ /admin/products/[id]/edit), «Удалить» (с confirm)
- Кнопка «+ Новый товар» → /admin/products/new

### Форма товара (создание/редактирование) — ProductForm.jsx
Большая форма с секциями:

#### Основное
- NAME (Input)
- Категория (select из /api/categories — иерархический)
- Бренд (select из /api/brands)
- Поставщик (select из /api/suppliers)
- SKU
- Описание (textarea)
- hs_code
- Вес
- is_exclusive (checkbox)

#### Технические характеристики (всегда показывать)
- power_cold, power_heat, size_internal, size_external, air_flow
- (если значение пустое — отправлять NULL)

#### Характеристики (productspecifications)
- Динамический список строк: NAME + VALUE + UNIT
- Кнопка «+ Добавить характеристику»
- Кнопка удаления на каждой строке

#### Медиафайлы
- Список существующих media (если редактирование):
  - Превью + TYPE + кнопка удаления (DELETE /api/admin/media/:id)
- Загрузка новых:
  - `<input type="file" multiple>` → POST /api/admin/products/:id/media
  - Drag-and-drop (опционально)
- Поле «Добавить по ссылке»:
  - URL input + select TYPE (image/video/doc) + кнопка → POST /api/admin/products/:id/media-url

⚠️ Загрузка медиа доступна ТОЛЬКО при редактировании (нужен product_id).
При создании нового товара — сначала сохранить, потом редирект на /edit для добавления медиа.

#### Цены (по филиалам)
- Таблица: Филиал | Цена | Скидочная цена | Дата от | Дата до | Удалить
- Кнопка «+ Добавить цену для филиала»
- При сохранении товара — отправляется массив prices целиком, бэк делает DELETE+INSERT в транзакции

#### Кнопки
- «Сохранить» → POST или PUT
- «Отмена» → /admin/products
- При успехе → Toast + редирект на список или на edit (для медиа после create)

---

## 🎨 ШАГ 6.5 — `/admin/orders`

### Список
- Фильтр по статусу
- Фильтр по дате (опционально)
- Поиск по email пользователя
- DataTable: №заказа | Пользователь | Сумма | OrderStatusBadge | Дата | Действия
- Клик по строке → /admin/orders/[id]

### Детали `/admin/orders/[id]`
- Все данные заказа (как в Фазе 4 для пользователя)
- Дополнительно — данные пользователя (email, телефон)
- Dropdown «Сменить статус» → PUT /api/admin/orders/:id/status
- При успехе → Toast + обновить данные

---

## 🎨 ШАГ 6.6 — `/admin/users`

- DataTable: ID | Email | Имя | Телефон | Роль | Дата регистрации | Действия
- Поиск по email/имени
- В колонке Роль — Badge (user / admin)
- Действие «Сменить роль» → dropdown user/admin → PUT /api/admin/users/:id/role
- Самопонижение запрещено (бэк вернёт 400, фронт дополнительно скрывает свой dropdown)

---

## 🎨 ШАГ 6.7 — `/admin/categories`

Плоский список или дерево с управлением:
- DataTable / TreeView: ID | NAME | parent (имя родителя или «Корневая») | Действия
- «+ Новая категория» → форма (NAME + parent_id select)
- Редактирование inline или модалкой
- Удаление с проверкой (бэк вернёт 400 если есть дочерние/товары — Toast с сообщением)

---

## 🎨 ШАГ 6.8 — `/admin/promotions`

- Список акций с датами действия (активная/будущая/завершённая)
- Создание/редактирование: NAME, description, valid_from, valid_to
- На странице акции — управление товарами:
  - Список товаров в акции с promo_price
  - «Добавить товар» → search-select + поле promo_price → POST
  - Удаление товара из акции

---

## 🧩 КОМПОНЕНТЫ ФАЗЫ

```
components/
  admin/
    AdminLayout.jsx           (или /admin/layout.jsx)
    StatsCard.jsx
    DataTable.jsx             (с сортировкой, поиском, пагинацией)
    ProductForm.jsx           (большая форма из 6.4)
    OrderStatusBadge.jsx      (если ещё не вынесена из Фазы 4)
    SpecificationsEditor.jsx  (динамический список)
    PricesEditor.jsx          (таблица цен)
    MediaUploader.jsx         (загрузка фото + URL)
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

1. Не-админ на `/admin/*` → редирект на `/` с Toast «Доступ запрещён»
2. Админ на `/admin` → дашборд с реальной статистикой
3. CRUD товаров: создание, редактирование, удаление, загрузка фото — всё работает
4. Загруженное фото сразу видно на сайте (на карточке товара через getImageUrl)
5. Удаление media — если локальный файл, физический файл удаляется из /backend/uploads
6. Смена статуса заказа в админке отражается в личном кабинете пользователя
7. Смена роли пользователя на admin → пользователь после повторного логина видит /admin
8. Админ не может понизить свою роль (бэк 400)
9. Удаление непустой категории → 400 с понятным сообщением
10. Создание акции с promo_price → на витрине цена пересчитывается через getEffectivePrice (приоритет promo)

---

## 🚫 НАПОМИНАНИЕ

- ВСЕ роуты `/api/admin/*` обязательно за `authMiddleware + adminMiddleware`
- НЕ возвращать password_hash даже в /api/admin/users
- multer fileFilter для безопасности (только картинки)
- Лимит размера файла обязателен
- При удалении media — проверка типа (если 'image'/локальный файл — fs.unlink)
- Транзакции при обновлении товара (specs + prices replace)
