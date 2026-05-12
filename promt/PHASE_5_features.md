# ФАЗА 5 — УНИКАЛЬНЫЕ ФИЧИ

> 📖 Полный контекст: `MASTER.md`. Фазы 0–4 должны быть выполнены.

---

## 🎯 ЦЕЛЬ ФАЗЫ

5 фич, которые отличают «СтройХаб» от обычного маркетплейса:
1. **Калькулятор материалов** — `/calculator`
2. **Мастер недели** — на главной + `/masters`
3. **Smart Bundle** — улучшение блока «Сопутствующие товары» (если в Фазе 1 он базовый, здесь доводим)
4. **Проверка комплектности корзины** — кнопка в `/cart`
5. **Мои Проекты** — `/account/projects`

⚠️ Если ФИЧА #3 (Smart Bundle) уже полностью сделана в Фазе 1 — пропускаем.

---

## 🧮 ФИЧА #1 — Калькулятор материалов `/calculator`

### Конфиг расчётов
Создать `/frontend/src/data/calculator.js`:

```javascript
// Структура:
export const CALCULATORS = {
  tile: {
    name: 'Укладка плитки',
    icon: '...',
    inputs: [
      { id: 'area', label: 'Площадь, м²', type: 'number' },
      { id: 'tile_size', label: 'Размер плитки', type: 'select', options: [...] }
    ],
    calculate: (inputs) => [
      // Возвращает массив материалов:
      { name: 'Плиточный клей', quantity: ..., unit: 'кг', searchQuery: 'клей плиточный', categoryId: ... },
      { name: 'Затирка', quantity: ..., unit: 'кг', searchQuery: 'затирка', categoryId: ... },
      { name: 'Грунтовка', ... },
      { name: 'Крестики для плитки', ... }
    ]
  },
  plaster: {  // штукатурка
    name: 'Штукатурка стен',
    inputs: [...],
    calculate: (inputs) => [...]   // смесь, грунт, маяки
  },
  roofing: {  // кровля
    name: 'Кровля',
    inputs: [...],
    calculate: (inputs) => [...]   // материал, крепёж, уплотнитель
  },
  screed: {   // стяжка
    name: 'Стяжка пола',
    inputs: [...],
    calculate: (inputs) => [...]   // смесь, сетка
  },
  paint: {    // покраска
    name: 'Покраска',
    inputs: [...],
    calculate: (inputs) => [...]   // краска, грунт, кисти/валик
  }
}
```

Формулы расчётов — приближённые, нормативные (например, плиточный клей: 4-5 кг на м² при толщине слоя 5мм).

### UI страницы `/calculator`

```
1. Выбор типа расчёта (карточки с иконками)
2. После выбора — форма с inputs из конфига
3. Кнопка «Рассчитать»
4. Результат: список материалов с количествами
   Для каждого материала — слот «подобрать товар»:
     → дёргает /api/products?q=<searchQuery>&category_id=<categoryId>&limit=5
     → пользователь выбирает конкретный товар (radio в карточке)
5. Внизу:
   - «Добавить всё в корзину» → cartStore.addItem для каждого выбранного × нужное количество
   - «Сохранить в проект» → если залогинен → выбор проекта (или новый) → projectsStore (см. фичу #5)
                            если не залогинен → Toast с предложением войти
```

Точка входа: ссылка в Header или Footer + блок на главной (заменяет заглушку из Фазы 1).

---

## 👷 ФИЧА #2 — Мастер недели

### Данные
Создать `/frontend/src/data/masters.js` (статические, 5-8 мастеров):

```javascript
export const MASTERS = [
  {
    id: 'master_1',
    name: 'Иван Петров',
    city: 'Москва',
    specialty: 'Кровельщик',
    photo: '/images/masters/ivan.jpg',  // положить в /frontend/public/images/masters/
    project: {
      title: 'Реконструкция крыши частного дома',
      before: '/images/masters/ivan_before.jpg',
      after: '/images/masters/ivan_after.jpg',
      description: '...'
    },
    usedProducts: [12, 45, 78],  // product_id из БД
    tips: [
      'При выборе металлочерепицы обращайте внимание на толщину стали...',
      '...'
    ]
  },
  ...
]
```

### UI
- На главной — карточка «Мастер недели» (один случайный/первый из массива):
  - Фото мастера, имя, специальность, город
  - Превью проекта (before/after)
  - Кнопка «Подробнее» → `/masters/[id]`
  - Ссылка «Все мастера» → `/masters`

- `/masters` — сетка всех мастеров

- `/masters/[id]` — страница мастера:
  - Фото, имя, специальность
  - Описание проекта + слайдер before/after
  - Список советов
  - Блок «Используемые материалы»:
    - Подгрузить товары через `/api/products?ids=12,45,78` (или Promise.all)
    - ProductCard для каждого

Точка входа: блок на главной (Фаза 1 оставляла заглушку, теперь наполняем).

---

## 🔗 ФИЧА #3 — Smart Bundle (доработка)

Если в Фазе 1 блок «Сопутствующие» уже полностью реализован с чекбоксами и живым пересчётом — пропускаем.

Если был сделан минимально (без чекбоксов или без пересчёта суммы) — доводим:
- Чекбоксы на каждой карточке в горизонтальном скролле
- Под скроллом — живой пересчёт: «Выбрано: N товаров на сумму X ₽»
- Кнопка «Добавить выбранное в корзину» → cartStore.addItem каждого выбранного

API уже есть: `/api/products/:id/related?type=сопутствующий`.

---

## ✅ ФИЧА #4 — Проверка комплектности корзины

### Матрица совместимости
Создать `/frontend/src/data/compatibility.js`:

```javascript
// Формат:
export const COMPATIBILITY_MATRIX = {
  // Если в корзине есть товар категории X:
  [CATEGORY_ID_FLOOR]: {
    requires: [CATEGORY_ID_UNDERLAY, CATEGORY_ID_THRESHOLD],
    messages: {
      [CATEGORY_ID_UNDERLAY]: 'Не забудьте подложку — без неё ламинат прослужит меньше',
      [CATEGORY_ID_THRESHOLD]: 'Нужны порожки для перехода между комнатами'
    }
  },
  [CATEGORY_ID_TILE]: {
    requires: [CATEGORY_ID_GLUE, CATEGORY_ID_GROUT],
    messages: {
      [CATEGORY_ID_GLUE]: 'К плитке нужен плиточный клей',
      [CATEGORY_ID_GROUT]: 'Не забудьте затирку для швов'
    }
  },
  // ...
}
```

ID категорий — реальные из БД (после Фазы 1 они известны).

### UI в корзине

В `/cart` (на CartSummary или рядом) — кнопка «Проверить комплектность»:

```
1. Анализирует category_id всех товаров в корзине
2. Для каждой найденной категории смотрит COMPATIBILITY_MATRIX
3. Проверяет: есть ли уже в корзине товар каждой required-категории
4. Если чего-то не хватает — показывает Modal:
   «В вашей корзине могут отсутствовать:
    • Подложка для ламината — Не забудьте подложку...
      [Кнопка «Найти товар»] → /catalog/<slug категории>
    • Порожки — Нужны порожки...
      [Кнопка «Найти товар»]
   »
5. Если всё ок → Toast «Комплектность в порядке ✓»
```

Чтобы получить category_id товаров в корзине — либо хранить его в cartStore при добавлении (расширить items), либо подгружать через `/api/products?ids=`.

**Рекомендую:** расширить cartStore.items полем `category_id`, наполнять при addItem.

---

## 📁 ФИЧА #5 — Мои Проекты `/account/projects`

### Данные — localStorage (как корзина и избранное)

### Zustand `projectsStore` (с persist)
```javascript
{
  projects: [
    {
      id: string (uuid),
      name: string,
      type: 'repair' | 'construction' | 'dacha' | 'commercial',
      budget: number,
      items: [
        {
          product_id: number,
          name: string,
          image: string | null,
          quantity_planned: number,
          quantity_bought: number,
          price_fixed: number,
          status: 'planned' | 'in_cart' | 'purchased' | 'cancelled'
        }
      ],
      shareToken: string,  // crypto.randomUUID() при создании
      createdAt: string
    }
  ],
  createProject: (data) => string (id),
  updateProject: (id, patch) => void,
  deleteProject: (id) => void,
  addItemToProject: (projectId, item) => void,
  updateItemStatus: (projectId, productId, status) => void,
  getByShareToken: (token) => Project | null
}
```

### UI

#### `/account/projects` (список)
- Сетка ProjectCard:
  - Название, тип (бейдж), дата создания
  - Прогресс-бар бюджета: `(сумма purchased) / budget`
  - Количество позиций
  - Кнопки: «Открыть», «Удалить» (с confirm), «Поделиться» (копирует ссылку с shareToken)
- Кнопка «+ Новый проект» → модалка с формой (name, type, budget)

#### `/account/projects/[id]` (детали)
- Заголовок + редактирование данных проекта
- Таблица-смета:
  - Колонки: Товар | Запланировано | Куплено | Цена за ед. | Статус | Действия
  - Action: смена статуса dropdown'ом (planned/in_cart/purchased/cancelled)
  - При смене на `in_cart` → cartStore.addItem
- Круговая диаграмма расходов (Recharts или своя SVG):
  - Сегменты по категориям ИЛИ по статусам (planned vs purchased)
- Кнопка «Поделиться» → копирует `/project/[shareToken]`

#### `/project/[shareToken]` (публичная)
- Только просмотр (без редактирования)
- Если токен не найден → 404
- Шапка: «Проект <name> от <user.name>»
- Список товаров с актуальными ценами
- НЕТ кнопок управления, нет авторизации (публично)

### Точка входа на товаре
На карточке товара `/product/[id]` — кнопка «+ В проект»:
- Если не залогинен → Toast «Войдите, чтобы добавить в проект»
- Если залогинен → дропдаун со списком проектов (или «Создать новый»)
- При выборе → projectsStore.addItemToProject + Toast «Добавлено в проект»

---

## 🧩 КОМПОНЕНТЫ ФАЗЫ

```
components/
  calculator/
    CalculatorTypePicker.jsx
    CalculatorForm.jsx
    CalculatorResults.jsx
    MaterialSlot.jsx          (один материал + подбор товара)
  masters/
    MasterCard.jsx
    MasterDetails.jsx
    BeforeAfterSlider.jsx
  cart/
    CompletenessCheck.jsx     (модалка-проверка комплектности)
  account/
    ProjectCard.jsx
    ProjectForm.jsx           (создание/редактирование)
    ProjectItemsTable.jsx
    ProjectBudgetChart.jsx

store/
  projectsStore.js            (с persist)

data/
  calculator.js
  masters.js
  compatibility.js
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

1. `/calculator`: можно выбрать тип, ввести параметры, увидеть список материалов с подбором товаров, добавить всё в корзину
2. На главной — карточка Мастера недели с реальными данными
3. `/masters` — список, `/masters/[id]` — детали с before/after и используемыми товарами (загружаются из БД)
4. Smart Bundle на карточке товара: чекбоксы, живой пересчёт, добавление выбранного в корзину
5. В корзине кнопка «Проверить комплектность»: при отсутствии soputstvuyushih показывает модалку, при наличии — Toast «Всё ок»
6. Создание проекта работает, проект сохраняется после refresh
7. `+ В проект` на карточке товара добавляет позицию в выбранный проект
8. Смета проекта: смена статуса на `in_cart` добавляет товар в корзину
9. Публичная ссылка `/project/[token]` открывается без авторизации, только просмотр
10. Удаление проекта с confirm убирает его из списка

---

## 🚫 НАПОМИНАНИЕ

- НЕ alert — Toast / Modal
- НЕ TypeScript
- shareToken генерится на клиенте через crypto.randomUUID()
- Все persist-store пишут в localStorage, не пересекаются с auth-токеном (тот в cookie)
