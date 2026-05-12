# ФАЗА 3 — КОРЗИНА И ОФОРМЛЕНИЕ ЗАКАЗА

> 📖 Полный контекст: `MASTER.md`. Фазы 0, 1, 2 должны быть выполнены.

---

## 🎯 ЦЕЛЬ ФАЗЫ

После этой фазы:
- Кнопки «В корзину» на всех карточках/листингах работают (не заглушки)
- `/cart` показывает товары, можно менять количество, удалять
- Корзина переживает refresh (localStorage)
- Залогиненный пользователь может оформить заказ через `/checkout`
- Заказ сохраняется в БД, корзина очищается, редирект на success-страницу
- Незалогиненному при попытке оформить заказ — модалка «Войдите чтобы оформить заказ»

❌ Проверка комплектности корзины (ФИЧА #4) — оставляем на Фазу 5.

---

## 🗄️ ШАГ 3.1 — СХЕМА БД (заказы)

```sql
Orders
  order_id    INT AUTO_INCREMENT PK
  user_id     INT NOT NULL FK → Users(user_id) ON DELETE CASCADE
  status      ENUM('pending','processing','completed','cancelled') DEFAULT 'pending'
  total       DECIMAL(15,2) DEFAULT 0
  address_id  INT NULL FK → Addresses(address_id)   -- адрес доставки
  -- опц. поля по необходимости (city, address текстом — на случай удаления Address)
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP

OrderItems
  order_item_id  INT AUTO_INCREMENT PK
  order_id       INT NOT NULL FK → Orders(order_id) ON DELETE CASCADE
  product_id     INT NOT NULL FK → Products(product_id) ON DELETE CASCADE
  quantity       INT DEFAULT 1
  price          DECIMAL(15,2) NOT NULL  -- цена зафиксированная на момент заказа

CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_orderitems_order ON OrderItems(order_id);
CREATE INDEX idx_orderitems_product ON OrderItems(product_id);
```

SQL-скрипт: `/backend/sql/04_orders_schema.sql`.

---

## 🛒 ШАГ 3.2 — FRONTEND: cartStore

Корзина в **localStorage**, не в БД. Только при оформлении заказа отправляется на сервер.

### Zustand `cartStore` (с persist в localStorage)
```javascript
{
  items: [
    {
      product_id: number,
      name: string,
      sku: string,
      image: string | null,         // оригинальный url из productmedia
      price: number,                // ЗАФИКСИРОВАННАЯ на момент добавления
      quantity: number,
      branch_id: number             // филиал текущей цены
    }
  ],
  addItem: (product, quantity = 1) => void,
  removeItem: (product_id) => void,
  updateQuantity: (product_id, quantity) => void,
  clearCart: () => void,
  // геттеры:
  totalItems: number,
  totalPrice: number
}
```

**Важно про цену:**
- При добавлении — берём `finalPrice` из текущего расчёта `getEffectivePrice` для выбранного города
- В корзине цена «замороженная»
- Если пользователь сменит город — цены в корзине НЕ пересчитываются (это корзина, не каталог). Можно показать предупреждение «Цены могут отличаться в новом городе» (опционально).

### Подключение к UI
- ProductCard «В корзину» → `cartStore.addItem`
- Карточка товара Stepper + «В корзину» → addItem с количеством
- Блок «Сопутствующие» → «Добавить выбранное» → addItem каждого выбранного
- Header иконка корзины показывает `totalItems` бейджем

---

## 🎨 ШАГ 3.3 — FRONTEND: страница `/cart`

```
Левая колонка — список товаров (CartItem):
  - Фото, название, SKU, цена за единицу
  - Stepper для количества → updateQuantity
  - Итого по позиции (price × quantity)
  - Иконка удаления → removeItem (с Toast «Удалено» + кнопкой Undo, опционально)
  - Если items.length === 0 → пустое состояние с иконкой и кнопкой «В каталог»

Правая панель (CartSummary):
  - Промокод (Input + кнопка «Применить») — UI без логики, заглушка
    (при клике Toast «Промокоды появятся скоро»)
  - Сумма / скидка / итого (большим шрифтом)
  - «Оформить заказ» (большая primary-кнопка):
    → если authStore.isAuthenticated → router.push('/checkout')
    → иначе → открыть Modal «Войдите чтобы оформить заказ»
       с двумя кнопками: «Войти» (→ /auth/login?redirect=/checkout)
                          «Регистрация» (→ /auth/register?redirect=/checkout)
```

---

## 🔌 ШАГ 3.4 — BACKEND API (заказы)

```
ЛИЧНЫЙ КАБИНЕТ [authMiddleware]
  GET    /api/account/orders        — заказы пользователя (только свои!)
  GET    /api/account/orders/:id    — детали заказа (проверка что order.user_id === req.user.user_id)
  POST   /api/account/orders        — создать заказ из корзины

  GET    /api/account/addresses     — адреса пользователя
  POST   /api/account/addresses     — добавить адрес
  DELETE /api/account/addresses/:id — удалить адрес (проверка владения)
```

### POST `/api/account/orders` — создание заказа

Тело запроса:
```json
{
  "items": [
    { "product_id": 1, "quantity": 2, "price": 1500.00 },
    ...
  ],
  "address_id": 5,                  // или null если самовывоз
  "branch_id": 2,                   // для самовывоза
  "total": 5000.00
}
```

Логика:
1. Транзакция MySQL (`pool.getConnection()` + `connection.beginTransaction()`)
2. Создать запись в `Orders` (user_id из req.user, status='pending')
3. Для каждого item — `OrderItems`
4. Пересчитать total на бэке (НЕ доверять total из тела — пересчитать сумму OrderItems и сравнить, в случае расхождения залогировать)
5. commit
6. Вернуть `{ success: true, data: { order_id, total, status } }`

**Важно:** `price` в OrderItems — это `price` который пришёл из тела (зафиксированная на момент добавления в корзину). Это нужно чтобы пользователь не получил неприятный сюрприз если цена выросла.

При ошибке — `rollback`.

### GET `/api/account/orders`
- Только заказы текущего пользователя (`WHERE user_id = ?`)
- Сортировка по дате убыв.
- Опц. пагинация

### GET `/api/account/orders/:id`
- JOIN OrderItems + Products (для отображения)
- Проверка `order.user_id === req.user.user_id`, иначе 403

### Адреса
- Все три роута фильтруют/проверяют `user_id = req.user.user_id`

---

## 🎨 ШАГ 3.5 — FRONTEND: `/checkout`

Обёрнут в `<ProtectedRoute>`.

### Шаг 1 — Доставка
```
- Список сохранённых адресов (GET /api/account/addresses)
  - Радио-выбор + «Добавить новый адрес»
- Форма добавления нового адреса (city, address) → POST → обновить список
- ИЛИ переключатель «Самовывоз» → выбор филиала из /api/branches?city=<выбранный>
```

### Шаг 2 — Подтверждение
```
- Список товаров из cartStore (только просмотр, без степперов)
- Адрес или филиал самовывоза
- Итоговая сумма
- Кнопка «Оформить заказ»:
  → POST /api/account/orders с { items, address_id|branch_id, total }
  → При успехе:
      cartStore.clearCart()
      router.push(`/order/success?id=${order_id}`)
  → При ошибке: Toast с сообщением
```

### `/order/success?id=...`
```
- Большая «галочка» / иконка успеха
- «Заказ №X оформлен»
- Краткие детали (сумма, адрес доставки/филиал)
- Кнопка «Перейти в мои заказы» → /account/orders
- Кнопка «Продолжить покупки» → /
```

---

## 🧩 КОМПОНЕНТЫ ФАЗЫ

```
components/
  ui/
    Modal.jsx              (нужен для модалки «Войдите чтобы оформить»)
    Drawer.jsx             (опц., если ещё не сделан)
  cart/
    CartItem.jsx
    CartSummary.jsx

store/
  cartStore.js             (с persist в localStorage)
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

1. Кнопки «В корзину» на ProductCard и карточке товара добавляют товар, бейдж в Header обновляется
2. `/cart` показывает добавленные товары, Stepper меняет количество, удаление работает
3. Refresh страницы → корзина сохраняется (localStorage)
4. Незалогиненный → «Оформить заказ» открывает модалку, не перебрасывает на /checkout
5. Залогиненный → `/checkout` шаг 1 (адреса) → шаг 2 (подтверждение)
6. После оформления: заказ в БД, корзина пуста, редирект на /order/success
7. `/api/account/orders` возвращает ТОЛЬКО заказы текущего пользователя
8. Попытка GET `/api/account/orders/:id` чужого заказа → 403
9. POST заказа без токена → 401
10. Транзакция работает: при искусственной ошибке в OrderItems — Order не создаётся (rollback)

---

## 🚫 НАПОМИНАНИЕ

- НЕ конкатенация SQL
- НЕ alert() — Toast
- При создании заказа ВСЕГДА транзакция
- НЕ доверять `total` от клиента — пересчитывать на бэке
- НЕ возвращать чужие заказы по `/api/account/orders/:id`
