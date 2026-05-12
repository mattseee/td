// Матрица совместимости категорий
// Ключ — category_id; если в корзине есть товар этой категории,
// проверяем наличие requires-категорий.
//
// Реальные category_id из products_db:
//  1 — Кровля (корень)
//  2 — Климатика (корень)
//  3 — Стены и потолки (корень)
//  4 — Полы (корень)
//  5 — Металлочерепица
//  6 — Профнастил
//  7 — Кондиционеры
//  8 — Гипсокартон
//  9 — Штукатурные смеси
// 10 — Ламинат

export const COMPATIBILITY_MATRIX = {
  8: {
    // Гипсокартон → нужна штукатурная смесь для шпаклёвки швов
    requires: [9],
    messages: {
      9: 'Для шпаклёвки стыков гипсокартона нужна финишная штукатурная смесь',
    },
  },
  5: {
    // Металлочерепица → может понадобиться профнастил для доборных элементов
    requires: [6],
    messages: {
      6: 'Для обшивки фронтонов и карнизных свесов часто нужен профнастил',
    },
  },
  6: {
    // Профнастил → может понадобиться металлочерепица для конька
    requires: [5],
    messages: {
      5: 'Для конька кровли из профнастила обычно используют коньковый элемент из металлочерепицы',
    },
  },
  10: {
    // Ламинат → нужна штукатурная смесь для выравнивания основания
    requires: [9],
    messages: {
      9: 'Перед укладкой ламината необходима выравнивающая смесь для подготовки основания пола',
    },
  },
}

// Вспомогательная функция: проверяет корзину и возвращает список проблем
// items — массив объектов { category_id, ... }
export function checkCompatibility(items) {
  const categoryIdsInCart = new Set(items.map(i => i.category_id).filter(Boolean))
  const issues = []

  for (const [catId, rule] of Object.entries(COMPATIBILITY_MATRIX)) {
    const numCatId = parseInt(catId)
    if (!categoryIdsInCart.has(numCatId)) continue

    for (const reqCatId of rule.requires) {
      if (!categoryIdsInCart.has(reqCatId)) {
        issues.push({
          triggerCategoryId: numCatId,
          missingCategoryId: reqCatId,
          message: rule.messages[reqCatId],
        })
      }
    }
  }

  return issues
}

export const CATEGORY_SLUGS = {
  1: 'roofing',
  2: 'climate',
  3: 'walls',
  4: 'floors',
  5: 'roofing',
  6: 'roofing',
  7: 'climate',
  8: 'walls',
  9: 'walls',
  10: 'floors',
}

export const CATEGORY_NAMES = {
  1: 'Кровля',
  2: 'Климатика',
  3: 'Стены и потолки',
  4: 'Полы',
  5: 'Металлочерепица',
  6: 'Профнастил',
  7: 'Кондиционеры',
  8: 'Гипсокартон',
  9: 'Штукатурные смеси',
  10: 'Ламинат',
}
