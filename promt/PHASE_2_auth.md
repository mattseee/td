# ФАЗА 2 — АВТОРИЗАЦИЯ (END-TO-END)

> 📖 Полный контекст: `MASTER.md`. Эта фаза — авторизация насквозь: БД → API → фронт → защита роутов.
> ⚠️ Предполагается, что Фазы 0 и 1 выполнены.

---

## 🎯 ЦЕЛЬ ФАЗЫ

После этой фазы:
- Пользователь может зарегистрироваться на `/auth/register`
- Может войти на `/auth/login`
- JWT-токен сохраняется в httpOnly cookie
- Header показывает имя пользователя вместо «Войти / Регистрация»
- Кнопка «Выйти» работает
- Защищённые страницы (заглушки `/account` и `/admin`) редиректят неавторизованных на `/auth/login`
- Админ-роуты редиректят не-админов
- Отзывы на товаре теперь привязаны к авторизованному пользователю (если залогинен)

---

## 🗄️ ШАГ 2.1 — СХЕМА БД (пользовательская часть)

Создать таблицы:

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
```

Создать SQL-скрипт `/backend/sql/03_users_schema.sql`.

### Сиды
- 1 админ: `admin@stroyhub.local` / пароль захардкоженный (например `admin12345`), `role='admin'`
- 1-2 обычных пользователя для тестов

Пароли — хэшированные через bcrypt (saltRounds: 10). Генерацию хэшей сделать скриптом `/backend/sql/seed_users.js` (запускается через `node`).

---

## 🔐 ШАГ 2.2 — BACKEND: JWT + Middleware

### Схема работы
```
Регистрация:
  POST /api/auth/register
  body: { email, password, name, phone }
  → проверить что email уникален
  → хэшировать пароль bcrypt (saltRounds: 10)
  → сохранить в Users (role='user')
  → сгенерировать JWT
  → вернуть { token, user: { user_id, email, name, role } }

Вход:
  POST /api/auth/login
  body: { email, password }
  → найти по email
  → bcrypt.compare с password_hash
  → сгенерировать JWT
  → вернуть { token, user }

Проверка токена:
  GET /api/auth/me
  header: Authorization: Bearer <token>
  → вернуть данные текущего пользователя

JWT payload:
  { user_id, email, role }
  expires: process.env.JWT_EXPIRES_IN
```

### `/backend/middleware/auth.js`
```javascript
// authMiddleware:
//   - читает Authorization header
//   - jwt.verify через JWT_SECRET
//   - кладёт в req.user = { user_id, email, role }
//   - 401 если токен невалидный/отсутствует

// adminMiddleware:
//   - используется ПОСЛЕ authMiddleware
//   - проверяет req.user.role === 'admin'
//   - 403 если нет
```

### Роуты
```
POST /api/auth/register    — публичный
POST /api/auth/login       — публичный
GET  /api/auth/me          — [authMiddleware]
```

### Подключение middleware к существующим роутам
Обновить роуты из Фазы 1:
- `POST /api/products/:id/reviews` — теперь опционально использует `authMiddleware`. Если пользователь авторизован — `user_name` берём из БД, не из тела запроса. Если не авторизован — оставляем как есть (имя из формы).

❌ В этой фазе НЕ защищаем `/api/account/*` и `/api/admin/*` — этих роутов ещё нет (они в Фазах 3, 4, 6). Middleware готовы к использованию.

---

## 🛡️ ШАГ 2.3 — БЕЗОПАСНОСТЬ

- `password_hash` НИКОГДА не возвращается в ответах API (фильтровать перед отправкой)
- bcrypt saltRounds: 10
- JWT_SECRET — минимум 32 символа в `.env`
- Параметризованные SQL-запросы (особенно при поиске по email)
- Валидация на бэке: email формат, пароль ≥ 8 символов
- Rate limiting на `/api/auth/login` опционально (если просто — пропустить, если хочется надёжно — `express-rate-limit`)

---

## 🎨 ШАГ 2.4 — FRONTEND: authStore + axios

### Zustand `authStore`
```javascript
{
  user: null,              // { user_id, email, name, role }
  token: null,
  isAuthenticated: false,
  login: (user, token) => void,    // сохранить + token в cookie через js-cookie
  logout: () => void,              // очистить + удалить cookie
  hydrate: () => void              // при загрузке приложения — прочитать cookie, дёрнуть /api/auth/me
}
```

**Хранение токена: ТОЛЬКО httpOnly cookie через js-cookie.** НЕ localStorage.

### Axios interceptor
В `/frontend/src/utils/api.js` (созданном в Фазе 0) дописать interceptor:
```javascript
// request interceptor:
//   читает токен из cookie → добавляет header Authorization: Bearer <token>

// response interceptor:
//   401 → authStore.logout() + редирект на /auth/login
```

### Гидратация при старте
В root layout (или в отдельном `<AuthProvider>`) при первом рендере:
1. Проверить cookie на наличие токена
2. Если есть — дёрнуть `/api/auth/me`
3. Положить user в authStore
4. Если 401 — очистить

---

## 🎨 ШАГ 2.5 — FRONTEND: страницы авторизации

### `/auth/login`
- Полноэкранная страница с брендированием
- Форма (React Hook Form):
  - email: формат email
  - password: минимум 8 символов
  - чекбокс «Запомнить меня» (для cookie expires)
- POST `/api/auth/login` → authStore.login → редирект на `/account` (или на `?redirect=` если был)
- Ошибки → Toast
- Ссылка «Нет аккаунта? Регистрация»

### `/auth/register`
- Форма:
  - имя
  - email
  - телефон (валидация российского формата `+7 (___) ___-__-__`)
  - пароль (минимум 8 символов)
  - подтверждение пароля
- POST `/api/auth/register` → authStore.login → редирект на `/account`
- Ссылка «Уже есть аккаунт? Войти»

### LoginForm.jsx и RegisterForm.jsx
Вынести логику форм в отдельные компоненты в `components/auth/`.

---

## 🛡️ ШАГ 2.6 — FRONTEND: ProtectedRoute и AdminRoute

### `components/auth/ProtectedRoute.jsx`
Обёртка-компонент:
- Если `!authStore.isAuthenticated` → редирект на `/auth/login?redirect=<current>`
- Иначе → `{children}`

### `components/auth/AdminRoute.jsx`
- Сначала проверяет авторизацию (как ProtectedRoute)
- Затем `authStore.user.role === 'admin'`
- Иначе → редирект на `/` + Toast «Доступ запрещён»

### Применение
В этой фазе создаём ЗАГЛУШКИ страниц (чтобы было что защищать):
- `/account/page.jsx` — обёрнута в `<ProtectedRoute>`, показывает «Личный кабинет (заглушка). Привет, {user.name}». Реальное содержимое — Фаза 4.
- `/admin/page.jsx` — обёрнута в `<AdminRoute>`, показывает «Админ-панель (заглушка)». Реальное содержимое — Фаза 6.

---

## 🎨 ШАГ 2.7 — FRONTEND: Header (обновление)

В Header (созданном в Фазе 1):
- Если `!isAuthenticated` → кнопки «Войти» / «Регистрация» (теперь это реальные ссылки на `/auth/login` и `/auth/register`)
- Если `isAuthenticated` → дроп-меню с именем пользователя:
  - «Личный кабинет» → `/account`
  - «Мои заказы» → `/account/orders` (заглушка пока)
  - «Админ-панель» (только если `role='admin'`) → `/admin`
  - «Выйти» → `authStore.logout()` + редирект на `/`

---

## 🧩 КОМПОНЕНТЫ ФАЗЫ

```
components/auth/
  LoginForm.jsx
  RegisterForm.jsx
  ProtectedRoute.jsx
  AdminRoute.jsx

store/
  authStore.js          (с хранением токена в cookie)

hooks/
  useAuth.js            (удобный доступ к authStore)
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

1. Регистрация работает: новый пользователь сохраняется в БД с хэшем
2. Логин работает: возвращает токен, токен ложится в cookie
3. Header показывает имя пользователя после логина
4. Refresh страницы — пользователь остаётся залогинен (гидратация работает)
5. Logout — кука очищается, Header возвращается к «Войти / Регистрация»
6. `/account` без логина → редирект на `/auth/login?redirect=/account`
7. `/admin` без админских прав → редирект на `/` с Toast «Доступ запрещён»
8. Логин админом → в Header появляется ссылка «Админ-панель»
9. В ответах API нет `password_hash` (проверить через DevTools Network)
10. JWT хранится в cookie, НЕ в localStorage (проверить DevTools Application)
11. Отзыв на товаре от залогиненного пользователя сохраняется с его именем (имя НЕ берётся из формы)

---

## 🚫 НАПОМИНАНИЕ

- НЕ хранить JWT в localStorage — только cookie
- НЕ возвращать password_hash никогда
- НЕ конкатенировать SQL
- bcrypt обязательно
