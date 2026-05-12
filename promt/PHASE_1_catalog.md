# ФАЗА 1 — КАТАЛОГ ТОВАРОВ (END-TO-END)

> 📖 Полный контекст проекта: см. `MASTER.md`. Эта фаза — каталог насквозь: БД → API → фронт.
> ⚠️ Предполагается, что Фаза 0 уже выполнена (проект запускается, дизайн-токены готовы).

---

## 🎯 ЦЕЛЬ ФАЗЫ

После этой фазы пользователь может:
- Открыть `/` и увидеть наполненную главную (Hero, категории, хиты, акции, эксклюзивы, бренды) — БЕЗ калькулятора и Мастера недели (это Фаза 5)
- Открыть `/catalog` — увидеть товары, отфильтровать, отсортировать, пагинация работает
- Открыть `/catalog/<slug>` — отфильтровано по категории
- Открыть `/product/[id]` — карточка товара со всеми табами (описание, характеристики, документы, отзывы, доставка), оставить отзыв
- Видеть блок «Сопутствующие» и «Аналоги» на карточке (ФИЧА #3 Smart Bundle здесь же)
- Поиском в Header находить товары
- Цены отображаются по выбранному городу (CitySelector в Header)

Корзины пока нет. Авторизации пока нет. Отзывы оставляются как `user_name` без привязки к пользователю.

---

## 🗄️ ШАГ 1.1 — СХЕМА БД (товарная часть)

Создать таблицы в `products_db`:

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
  power_cold    DECIMAL(10,2) NULL
  power_heat    DECIMAL(10,2) NULL
  size_internal VARCHAR(50)   NULL
  size_external VARCHAR(50)   NULL
  air_flow      DECIMAL(10,2) NULL
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
  -- url может быть https://... или photo.jpg

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

Создать SQL-скрипт `/backend/sql/01_products_schema.sql` с CREATE TABLE.

### Сиды (тестовые данные)
Создать `/backend/sql/02_seeds.sql` с тестовыми данными:
- 3-5 брендов
- Дерево категорий (минимум 2 уровня): например «Кровля» → «Металлочерепица», «Климатика» → «Кондиционеры»
- 2-3 поставщика
- 3-4 филиала в разных городах (Москва, СПб, Казань)
- 15-20 товаров с заполненными полями (включая climatic-поля для пары товаров)
- Цены для разных филиалов и дат
- Остатки
- Медиафайлы (можно пока внешние URL картинок-плейсхолдеров)
- Характеристики
- Связанные товары (сопутствующие + аналоги)
- 1-2 акции с promo-ценами
- Эксклюзивные товары (`is_exclusive=1`)
- Несколько отзывов

---

## 💰 ШАГ 1.2 — ЛОГИКА ЦЕН

Цена зависит от филиала и дат. Приоритет: **promo_price > discount_price > price**.

Создать `/backend/utils/pricing.js`:

```javascript
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

## 🔌 ШАГ 1.3 — BACKEND API РОУТЫ

Все ответы в едином формате (см. Фазу 0): `{ success: true, data: ... }`.
Все запросы — параметризованные. Все async — в try/catch.
Картинки в ответах — всегда через `resolveImageUrl` (из Фазы 0).

```
ТОВАРЫ
  GET /api/products
    query: category_id, brand_id, supplier_id, branch_id, city,
           in_stock, is_exclusive, price_min, price_max,
           sort (price_asc|price_desc|rating|newest),
           page, limit, q (поиск)
    Ответ: { success, data: [...products], total, page }
    Цена в каждом товаре — через getEffectivePrice для branch_id (или дефолтного филиала города)

  GET /api/products/:id
    Полный товар: JOIN brands, categories, suppliers, productmedia,
    productspecifications, документы, цены, остатки, рейтинг, кол-во отзывов

  GET /api/products/:id/related?type=сопутствующий|аналог|all
    Связанные товары (для блоков на карточке)

  GET /api/products/:id/reviews?sort=newest|rating_high
    Список отзывов

  POST /api/products/:id/reviews
    body: { user_name, rating, COMMENT }
    Без авторизации — пока. user_name из формы.

КАТЕГОРИИ
  GET /api/categories          — дерево с parent_id
  GET /api/categories/:id      — категория + хлебные крошки (рекурсивно по parent_id)

БРЕНДЫ
  GET /api/brands              — все бренды
  GET /api/brands/:id          — бренд + его товары

ФИЛИАЛЫ
  GET /api/branches?city=      — все филиалы (опц. фильтр по городу)
  GET /api/branches/cities     — список уникальных городов

ПОСТАВЩИКИ
  GET /api/suppliers           — все поставщики

АКЦИИ
  GET /api/promotions?active=true — активные акции
  GET /api/promotions/:id      — акция + товары

ЦЕНЫ И НАЛИЧИЕ
  GET /api/prices?product_id=&branch_id=
  GET /api/stock?product_id=&city=

ПОИСК
  GET /api/search?q=&limit=    — поиск по products.NAME, categories.NAME, brands.NAME
```

Структура папок бэка:
```
/backend
  /routes        — products.js, categories.js, brands.js, branches.js,
                   suppliers.js, promotions.js, prices.js, stock.js, search.js
  /utils         — getImageUrl.js, pricing.js
  /sql
  index.js
  db.js
```

В `index.js` подключить все роуты через `app.use('/api/...', router)`.

---

## 🎨 ШАГ 1.4 — FRONTEND: HEADER, ГОРОД, ПОИСК

### CitySelector
- Загружает список городов из `/api/branches/cities`
- Сохраняет выбор в Zustand `cityStore` (с persist в localStorage)
- В Header — кнопка с текущим городом, клик → дроуер/попап со списком

### `cityStore` (Zustand + persist)
```javascript
{
  city: string | null,         // 'Москва'
  branchIds: number[],         // [1, 2] — филиалы выбранного города
  setCity: (city, branchIds) => void
}
```

### Header
- Логотип «СтройХаб» → ссылка на `/`
- CitySelector
- Поиск (Input с debounce 300мс) → `/api/search?q=` → дропдаун с группами «Товары / Категории / Бренды»
- MegaMenu «Каталог» (открывается по hover/click) — дерево из `/api/categories`
- Кнопки «Войти / Регистрация» (заглушки — авторизация в Фазе 2)
- Иконка «Корзина» (заглушка — корзина в Фазе 3)

### MegaMenu
- Корневые категории (parent_id IS NULL) колонками
- При наведении на корневую — справа подкатегории
- На мобиле — fullscreen drawer с аккордеоном

### Footer
- Информация о компании, навигация, соцсети (заглушки)

### BottomNav (мобиле)
- Главная / Каталог / Поиск / Корзина / Аккаунт (последние два — заглушки)

---

## 🎨 ШАГ 1.5 — FRONTEND: ГЛАВНАЯ `/`

- **Hero-слайдер** — данные из активных `/api/promotions?active=true`. Framer Motion для перелистывания.
- **Быстрые категории** — корневые категории сеткой с иконками
- **Хиты продаж** — товары с высоким рейтингом (`/api/products?sort=rating&limit=8`)
- **Активные акции** — карточки акций
- **Эксклюзивные товары** — `/api/products?is_exclusive=1&limit=6`, бейдж «Эксклюзив» (цвет `--exclusive`)
- **Карусель брендов** — логотипы из `/api/brands` (горизонтальный скролл)

❌ Калькулятор материалов и Мастер недели — НЕ в этой фазе (это Фаза 5).

---

## 🎨 ШАГ 1.6 — FRONTEND: КАТАЛОГ `/catalog/[[...slug]]`

```
URL: /catalog → все товары
     /catalog/roofing → категория
     /catalog/roofing/metal → подкатегория

Сайдбар фильтров (FilterSidebar):
  - Категории (дерево из /api/categories)
  - Бренды (мультивыбор с поиском внутри)
  - Цена (RangeSlider с гистограммой)
  - Наличие (чекбокс in_stock)
  - Динамические фильтры из productspecifications
    (для текущей категории — уникальные NAME → чекбоксы или range)
  - Для климатики: power_cold, power_heat, air_flow (range-слайдеры)
  - Только эксклюзивные (чекбокс)

Основной контент:
  - Хлебные крошки
  - Сортировка: популярные / цена↑ / цена↓ / рейтинг / новинки
  - Вид: сетка (3/4 колонки) / список
  - Карточки товаров (ProductCard)
  - Пагинация
  - ActiveFilters — теги активных фильтров с крестиками
```

Состояние фильтров — в URL query params (чтобы можно было поделиться ссылкой).
Запросы через TanStack Query.
На мобиле — фильтры в bottom-sheet drawer.

### ProductCard
- Фото (через getImageUrl, lazy)
- Бренд (мелким текстом)
- Название (2 строки max, ellipsis)
- Бейджи: «Эксклюзив», «-N%», «Акция»
- Цена (PriceBlock — promo/discount/regular)
- StockBadge (наличие)
- «В корзину» (заглушка кнопки — корзина в Фазе 3, пока просто Toast «Скоро»)

---

## 🎨 ШАГ 1.7 — FRONTEND: КАРТОЧКА ТОВАРА `/product/[id]`

```
Левая колонка:
  - ProductGallery: images из productmedia (TYPE='image')
  - Видео если TYPE='video'
  - Документы-превью если TYPE='doc'
  - Бейджи: Эксклюзив (is_exclusive=1), % скидки, Акция

Правая колонка:
  - Бренд → /brands/[id]
  - Название (H1)
  - SKU + кнопка «Скопировать» (Toast при копировании)
  - Рейтинг + количество отзывов
  - PriceBlock (через getEffectivePrice для выбранного города):
    → promo: старая цена зачёркнута + бейдж акции + новая цена
    → discount: старая зачёркнута + новая + % скидки
    → regular: просто цена
    → нет города: «Выберите город для отображения цены»
  - StockBadge по городу (из /api/stock):
    → «В наличии в 3 магазинах» → клик → список филиалов с адресами
    → «Осталось 3 шт» (если quantity <= 5)
    → «Нет в наличии» + «Сообщить о поступлении» (заглушка)
  - Stepper количества + «В корзину» (заглушка — Фаза 3)
  - Кнопки: «В избранное» (заглушка), «Сравнить» (заглушка), «Поделиться»

Табы:
  1. Описание — description
  2. Характеристики (SpecsTable):
     - Фиксированные (weight, power_cold, power_heat,
       size_internal, size_external, air_flow — только если не null)
     - Динамические из productspecifications
  3. Документы — из таблицы documents (TYPE, url) + productmedia где TYPE='doc'
  4. Отзывы (ReviewsList):
     - Список + форма добавления
     - Фильтр по звёздам, гистограмма рейтингов
     - POST /api/products/:id/reviews
  5. Доставка — список branches с количеством из stock

Блок «Сопутствующие товары» (RelatedProducts, ФИЧА #3 Smart Bundle):
  - /api/products/:id/related?type=сопутствующий
  - Горизонтальный скролл + чекбоксы + живой пересчёт суммы
  - «Добавить выбранное» (заглушка кнопки — Фаза 3)

Блок «Аналоги»:
  - /api/products/:id/related?type=аналог
  - Горизонтальный скролл + кнопка «Сравнить» (заглушка)
```

---

## 🧩 КОМПОНЕНТЫ, КОТОРЫЕ СОЗДАЁМ В ЭТОЙ ФАЗЕ

```
components/
  ui/
    Button.jsx          (primary, secondary, ghost, danger)
    Input.jsx
    Skeleton.jsx        (НЕ спиннеры!)
    Badge.jsx
    RangeSlider.jsx
    Pagination.jsx
    RatingStars.jsx
    Stepper.jsx
    Toast.jsx           (нужен для копирования SKU и заглушек)
  layout/
    Header.jsx
    Footer.jsx
    MegaMenu.jsx
    BottomNav.jsx
    CitySelector.jsx
  product/
    ProductCard.jsx
    ProductGallery.jsx
    PriceBlock.jsx
    StockBadge.jsx
    SpecsTable.jsx
    ReviewsList.jsx
    RelatedProducts.jsx
  catalog/
    FilterSidebar.jsx
    ActiveFilters.jsx
    ProductGrid.jsx
    SortBar.jsx

store/
  cityStore.js
  uiStore.js              (для Toast-очереди)

hooks/
  useDebounce.js
```

❌ НЕ создаём в этой фазе: authStore, cartStore, favoritesStore, ProductForm (админка), AdminLayout.

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ ФАЗЫ

1. БД создана, сиды залиты, есть минимум 15 товаров
2. Главная: видны Hero, категории, хиты, акции, эксклюзивы, бренды
3. Каталог: открывается, фильтры применяются, сортировка работает, пагинация работает
4. Каталог по slug: `/catalog/<slug-категории>` фильтрует
5. Карточка товара: открывается, видны все 5 табов, отзыв можно добавить
6. Цена корректно меняется при смене города в CitySelector
7. Поиск в Header возвращает живые результаты с debounce
8. Блоки «Сопутствующие» и «Аналоги» отображаются
9. Мобильная адаптация: Header → fullscreen drawer, фильтры → bottom sheet, BottomNav снизу
10. Lighthouse Performance > 80 на каталоге

---

## 🚫 ОБЩИЕ ПРАВИЛА (напоминание)

- НЕ TypeScript, JavaScript
- НЕ готовые UI-библиотеки (MUI, Ant, Chakra, shadcn)
- НЕ конкатенация SQL — только параметризованные запросы
- НЕ возвращать password_hash (хотя в этой фазе и не работаем с users)
- НЕ alert() — только Toast
- НЕ фиктивные кнопки без обратной связи — заглушки минимум показывают Toast «Скоро в Фазе 3»
- Скелетоны вместо спиннеров при загрузке
