# ТД Сток — Строительный маркетплейс

## Стек

| Часть      | Технологии                                           |
|------------|------------------------------------------------------|
| Frontend   | Next.js 14, React 18, Zustand, TanStack Query, Framer Motion |
| Стилизация | Tailwind CSS + CSS-переменные (без UI-библиотек)     |
| Формы      | React Hook Form                                      |
| Backend    | Express.js, MySQL (mysql2/promise), JWT, bcrypt      |
| БД         | MySQL / phpMyAdmin                                   |

## Запуск

### 1. База данных

1. Открыть phpMyAdmin
2. Создать БД `products_db` (кодировка `utf8mb4_unicode_ci`)
3. Выполнить SQL-скрипты из `/backend/sql/` **по порядку**:
   - `01_products_schema.sql`
   - `02_seeds.sql`
   - `03_users_schema.sql`
   - `04_orders_schema.sql`
   - `05_indexes.sql`
4. Сгенерировать тестовых пользователей:
   ```bash
   cd backend && node sql/seed_users.js
   ```

### 2. Backend

```bash
cd backend
cp .env.example .env   # заполните своими данными
npm install
npm run dev            # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev            # http://localhost:3000
```

## Тестовые учётные записи

| Роль         | Email                  | Пароль     |
|--------------|------------------------|------------|
| Администратор | admin@stroyhub.local  | admin12345 |
| Пользователь  | user@stroyhub.local   | user12345  |

## Структура проекта

```
/td
  /frontend          — Next.js 14 (порт 3000)
    /src
      /app           — страницы (App Router)
      /components    — React-компоненты
      /store         — Zustand stores
      /utils         — утилиты (formatPrice, api, getImageUrl)
      /hooks         — useDebounce, useAuth
  /backend           — Express.js (порт 5000)
    /routes          — API роуты
    /middleware      — auth, upload
    /sql             — схема БД и сиды
    /uploads         — локальные фото товаров
    /utils           — pricing, getImageUrl
  README.md
```

## Ключевые фичи

1. **Калькулятор материалов** — расчёт количества материалов по площади
2. **Мастер недели** — витрина профессионалов с фото «до/после»
3. **Smart Bundle** — сопутствующие товары с групповым добавлением в корзину
4. **Проверка комплектности** — анализ корзины на недостающие позиции
5. **Мои проекты** — смета с бюджетом и диаграммой расходов

## Проверка работоспособности

```
GET http://localhost:5000/api/health
→ { "success": true, "data": { "status": "ok" } }
```
