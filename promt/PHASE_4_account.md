# ФАЗА 4 — ЛИЧНЫЙ КАБИНЕТ

> 📖 Полный контекст: `MASTER.md`. Фазы 0–3 должны быть выполнены.

---

## 🎯 ЦЕЛЬ ФАЗЫ

Полноценный личный кабинет:
- `/account` — дашборд с последними заказами и краткими данными профиля
- `/account/orders` — список всех заказов с фильтрами по статусу
- `/account/orders/[id]` — детали заказа
- `/account/addresses` — управление адресами (добавить/удалить)
- `/account/profile` — редактировать имя, телефон, email, сменить пароль
- `/account/favorites` — избранные товары (localStorage)

❌ `/account/projects` (Мои Проекты, ФИЧА #5) — отдельно в Фазе 5.

---

## 🔌 ШАГ 4.1 — BACKEND API

Большинство роутов уже создано в Фазе 3. Добавляем недостающие.

```
ЛИЧНЫЙ КАБИНЕТ [authMiddleware]
  ✅ GET    /api/account/orders         — из Фазы 3
  ✅ GET    /api/account/orders/:id     — из Фазы 3
  ✅ POST   /api/account/orders         — из Фазы 3
  ✅ GET    /api/account/addresses      — из Фазы 3
  ✅ POST   /api/account/addresses      — из Фазы 3
  ✅ DELETE /api/account/addresses/:id  — из Фазы 3

  🆕 PUT  /api/account/profile          — обновить name, phone, email
  🆕 PUT  /api/account/password         — сменить пароль
```

### PUT `/api/account/profile`
- Тело: `{ name, phone, email }`
- Если `email` меняется — проверить уникальность
- НЕ возвращать password_hash
- Ответ: `{ success: true, data: <updated user> }`

### PUT `/api/account/password`
- Тело: `{ oldPassword, newPassword }`
- bcrypt.compare oldPassword с password_hash в БД
- Если не совпадает → 400 с понятным сообщением
- Иначе bcrypt.hash newPassword (saltRounds: 10) → UPDATE
- Ответ: `{ success: true }`
- newPassword валидация: минимум 8 символов

---

## 🎨 ШАГ 4.2 — FRONTEND: AccountLayout

Создать общий layout для `/account/*`:
- Сайдбар с навигацией:
  - Дашборд → /account
  - Заказы → /account/orders
  - Адреса → /account/addresses
  - Профиль → /account/profile
  - Избранное → /account/favorites
  - Мои проекты → /account/projects (заглушка-ссылка пока, страница появится в Фазе 5)
- Основной контент справа
- На мобиле сайдбар → bottom drawer или горизонтальные табы
- Весь layout обёрнут в `<ProtectedRoute>`

---

## 🎨 ШАГ 4.3 — `/account` (дашборд)

```
- Карточка профиля: аватар (заглушка-инициалы), имя, email, телефон
- Последние 3 заказа (OrderCard) → ссылка «Все заказы»
- Карточки-плитки: «Адреса», «Избранное», «Мои проекты»
  с количеством и быстрым переходом
```

---

## 🎨 ШАГ 4.4 — `/account/orders`

```
- Фильтр по статусу (табы или dropdown):
  Все / Pending / Processing / Completed / Cancelled
- Список OrderCard:
  - №заказа, дата, сумма, OrderStatusBadge, краткий список товаров (первые 2-3)
  - Клик → /account/orders/[id]
- Пустое состояние: «У вас пока нет заказов» + кнопка «В каталог»
```

### `/account/orders/[id]` — детали
```
- №заказа, дата, OrderStatusBadge
- Адрес доставки или филиал самовывоза
- Список товаров (фото, название, количество, цена за единицу, итого)
- Итоговая сумма
- (Опционально) Кнопка «Повторить заказ» → добавляет все товары в корзину
```

---

## 🎨 ШАГ 4.5 — `/account/addresses`

```
- Список AddressCard: city, address, кнопка удаления (с confirm)
- Форма «Добавить адрес»: city, address → POST → обновить список через React Query invalidate
- Пустое состояние: «У вас нет сохранённых адресов»
```

---

## 🎨 ШАГ 4.6 — `/account/profile`

Две секции:

### Редактирование данных
- Форма (React Hook Form): name, email, phone
- Валидация (email формат, phone российский)
- PUT `/api/account/profile` → обновить authStore.user
- Toast «Профиль обновлён»

### Смена пароля
- Форма: old_password, new_password, confirm_new_password
- Валидация: new_password ≥ 8 символов, совпадает с confirm
- PUT `/api/account/password`
- Toast «Пароль изменён»
- Очистить поля формы после успеха

---

## 🎨 ШАГ 4.7 — `/account/favorites`

Избранное хранится в **localStorage** (как корзина).

### Zustand `favoritesStore` (с persist)
```javascript
{
  productIds: number[],
  toggle: (product_id) => void,
  isFavorite: (product_id) => boolean,
  clear: () => void
}
```

### UI
- Кнопка «В избранное» (сердечко) на ProductCard и карточке товара — теперь работает (НЕ заглушка)
- Страница `/account/favorites`:
  - Загрузить товары через `/api/products?ids=1,2,3` (ИЛИ batch endpoint, ИЛИ N параллельных запросов через Promise.all)
  - Если используем `?ids=` — добавить поддержку этого параметра в `/api/products` (`WHERE product_id IN (?)`)
  - Показать сеткой ProductCard
  - Пустое состояние

---

## 🧩 КОМПОНЕНТЫ ФАЗЫ

```
components/
  account/
    OrderCard.jsx
    AddressCard.jsx
    OrderStatusBadge.jsx        (если решишь хранить здесь, иначе в admin/)
  layout/
    AccountLayout.jsx           (или /account/layout.jsx в App Router)

store/
  favoritesStore.js             (с persist localStorage)
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

1. `/account` — дашборд показывает реальные данные пользователя
2. `/account/orders` — список заказов фильтруется по статусу
3. `/account/orders/[id]` — детали корректные, чужой заказ → 403
4. `/account/addresses` — добавление и удаление работают
5. `/account/profile` — обновление данных работает, authStore синхронизируется
6. Смена пароля: со старым неверным → ошибка с сообщением; с верным → успех
7. После смены email — повторный логин со старой почтой не работает, с новой — работает
8. `/account/favorites` — кнопка-сердечко на товарах добавляет/убирает, страница показывает избранное, refresh переживается
9. Все роуты `/api/account/*` без токена → 401

---

## 🚫 НАПОМИНАНИЕ

- НЕ возвращать password_hash
- bcrypt при смене пароля
- При обновлении email — проверка уникальности
- НЕ давать редактировать чужой профиль/адрес
