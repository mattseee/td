export const CALCULATORS = {
  tile: {
    id: 'tile',
    name: 'Укладка плитки',
    icon: '🔲',
    description: 'Расчёт материалов для укладки напольной и настенной плитки',
    inputs: [
      { id: 'area', label: 'Площадь, м²', type: 'number', min: 1, max: 10000, step: 0.5, defaultValue: 20 },
      {
        id: 'tile_size', label: 'Размер плитки', type: 'select',
        options: [
          { value: '20x20', label: '20×20 см', factor: 0.6 },
          { value: '30x30', label: '30×30 см', factor: 0.45 },
          { value: '30x60', label: '30×60 см', factor: 0.35 },
          { value: '60x60', label: '60×60 см', factor: 0.3 },
          { value: '60x120', label: '60×120 см', factor: 0.25 },
        ],
        defaultValue: '30x30',
      },
      {
        id: 'joint_width', label: 'Ширина шва', type: 'select',
        options: [
          { value: '2', label: '2 мм', groutFactor: 0.3 },
          { value: '3', label: '3 мм', groutFactor: 0.45 },
          { value: '4', label: '4 мм', groutFactor: 0.6 },
        ],
        defaultValue: '3',
      },
    ],
    calculate: (inputs) => {
      const area = parseFloat(inputs.area) || 0
      const tileSizeOpt = [
        { value: '20x20', factor: 0.6 },
        { value: '30x30', factor: 0.45 },
        { value: '30x60', factor: 0.35 },
        { value: '60x60', factor: 0.3 },
        { value: '60x120', factor: 0.25 },
      ].find(o => o.value === inputs.tile_size) || { factor: 0.45 }
      const jointOpt = [
        { value: '2', groutFactor: 0.3 },
        { value: '3', groutFactor: 0.45 },
        { value: '4', groutFactor: 0.6 },
      ].find(o => o.value === inputs.joint_width) || { groutFactor: 0.45 }

      const areaWithWaste = area * 1.1 // 10% запас на обрезку

      return [
        {
          name: 'Плиточный клей',
          quantity: Math.ceil(areaWithWaste * 4.5),
          unit: 'кг',
          note: '4.5 кг/м² при слое 5 мм',
          searchQuery: 'клей плиточный',
          categoryId: 10,
        },
        {
          name: 'Затирка для швов',
          quantity: parseFloat((area * jointOpt.groutFactor).toFixed(1)),
          unit: 'кг',
          note: `${jointOpt.groutFactor} кг/м² при шве ${inputs.joint_width} мм`,
          searchQuery: 'затирка швов плитка',
          categoryId: null,
        },
        {
          name: 'Грунтовка',
          quantity: parseFloat((area * 0.2).toFixed(1)),
          unit: 'л',
          note: '0.2 л/м² для укрепления основания',
          searchQuery: 'грунтовка бетоноконтакт',
          categoryId: 9,
        },
        {
          name: 'Крестики для плитки',
          quantity: Math.ceil(area * 18 * tileSizeOpt.factor),
          unit: 'шт',
          note: 'Для равномерных швов',
          searchQuery: 'крестики плитка',
          categoryId: null,
        },
      ]
    },
  },

  plaster: {
    id: 'plaster',
    name: 'Штукатурка стен',
    icon: '🪣',
    description: 'Расчёт штукатурной смеси, грунтовки и маяков для выравнивания стен',
    inputs: [
      { id: 'area', label: 'Площадь стен, м²', type: 'number', min: 1, max: 10000, step: 1, defaultValue: 40 },
      {
        id: 'thickness', label: 'Толщина слоя', type: 'select',
        options: [
          { value: '10', label: '10 мм (тонкий)', consumption: 8 },
          { value: '15', label: '15 мм (средний)', consumption: 12 },
          { value: '20', label: '20 мм (стандарт)', consumption: 16 },
          { value: '25', label: '25 мм (выравнивание)', consumption: 20 },
        ],
        defaultValue: '15',
      },
      {
        id: 'room_height', label: 'Высота потолка', type: 'select',
        options: [
          { value: '2.5', label: '2.5 м' },
          { value: '2.7', label: '2.7 м' },
          { value: '3.0', label: '3.0 м' },
        ],
        defaultValue: '2.7',
      },
    ],
    calculate: (inputs) => {
      const area = parseFloat(inputs.area) || 0
      const thicknessOpt = [
        { value: '10', consumption: 8 },
        { value: '15', consumption: 12 },
        { value: '20', consumption: 16 },
        { value: '25', consumption: 20 },
      ].find(o => o.value === inputs.thickness) || { consumption: 12 }
      const height = parseFloat(inputs.room_height) || 2.7

      const beaconLength = 3.0 // стандартная длина маяка
      const beaconSpacing = 1.2 // шаг установки
      const wallPerimeter = area / height
      const beacons = Math.ceil((wallPerimeter / beaconSpacing) * height / beaconLength)

      return [
        {
          name: 'Штукатурная смесь',
          quantity: Math.ceil(area * thicknessOpt.consumption * 1.05), // 5% запас
          unit: 'кг',
          note: `${thicknessOpt.consumption} кг/м² при слое ${inputs.thickness} мм`,
          searchQuery: 'штукатурка Кнауф Ротбанд',
          categoryId: 9,
        },
        {
          name: 'Грунтовка',
          quantity: parseFloat((area * 0.15).toFixed(1)),
          unit: 'л',
          note: '0.15 л/м² перед нанесением',
          searchQuery: 'грунтовка глубокого проникновения',
          categoryId: 9,
        },
        {
          name: 'Маяки штукатурные',
          quantity: beacons,
          unit: 'шт',
          note: 'Шаг 1.2 м, длина 3 м',
          searchQuery: 'маяк штукатурный',
          categoryId: null,
        },
      ]
    },
  },

  roofing: {
    id: 'roofing',
    name: 'Кровля',
    icon: '🏠',
    description: 'Расчёт кровельного покрытия, крепежа и уплотнителя',
    inputs: [
      { id: 'area', label: 'Площадь кровли, м²', type: 'number', min: 10, max: 50000, step: 1, defaultValue: 100 },
      {
        id: 'roof_type', label: 'Тип покрытия', type: 'select',
        options: [
          { value: 'tile', label: 'Металлочерепица', screwsPer: 8, categoryId: 5 },
          { value: 'corrugated', label: 'Профнастил', screwsPer: 6, categoryId: 6 },
        ],
        defaultValue: 'tile',
      },
      { id: 'perimeter', label: 'Периметр кровли, м', type: 'number', min: 10, max: 5000, step: 1, defaultValue: 40 },
    ],
    calculate: (inputs) => {
      const area = parseFloat(inputs.area) || 0
      const perimeter = parseFloat(inputs.perimeter) || 0
      const roofTypeOpt = [
        { value: 'tile', screwsPer: 8, categoryId: 5 },
        { value: 'corrugated', screwsPer: 6, categoryId: 6 },
      ].find(o => o.value === inputs.roof_type) || { screwsPer: 8, categoryId: 5 }

      return [
        {
          name: inputs.roof_type === 'tile' ? 'Металлочерепица' : 'Профнастил',
          quantity: parseFloat((area * 1.15).toFixed(1)), // 15% на нахлёст
          unit: 'м²',
          note: '15% запас на нахлёст',
          searchQuery: inputs.roof_type === 'tile' ? 'металлочерепица' : 'профнастил кровельный',
          categoryId: roofTypeOpt.categoryId,
        },
        {
          name: 'Кровельные саморезы',
          quantity: Math.ceil(area * roofTypeOpt.screwsPer),
          unit: 'шт',
          note: `${roofTypeOpt.screwsPer} шт/м²`,
          searchQuery: 'саморез кровельный',
          categoryId: null,
        },
        {
          name: 'Уплотнительная лента',
          quantity: parseFloat((perimeter * 1.1).toFixed(1)),
          unit: 'м',
          note: '10% запас по периметру',
          searchQuery: 'лента уплотнительная кровля',
          categoryId: null,
        },
        {
          name: 'Ветровая планка',
          quantity: Math.ceil(perimeter / 2.0),
          unit: 'шт',
          note: 'Длина планки 2 м',
          searchQuery: 'планка ветровая кровля',
          categoryId: null,
        },
      ]
    },
  },

  screed: {
    id: 'screed',
    name: 'Стяжка пола',
    icon: '🧱',
    description: 'Расчёт смеси для стяжки и армирующей сетки',
    inputs: [
      { id: 'area', label: 'Площадь помещения, м²', type: 'number', min: 1, max: 10000, step: 1, defaultValue: 30 },
      {
        id: 'thickness', label: 'Толщина стяжки', type: 'select',
        options: [
          { value: '30', label: '30 мм', kgPerM2: 56 },
          { value: '40', label: '40 мм', kgPerM2: 75 },
          { value: '50', label: '50 мм', kgPerM2: 94 },
          { value: '70', label: '70 мм', kgPerM2: 130 },
        ],
        defaultValue: '50',
      },
      {
        id: 'reinforcement', label: 'Армирование', type: 'select',
        options: [
          { value: 'mesh', label: 'Сетка (ячейка 100×100 мм)' },
          { value: 'fiber', label: 'Фиброволокно' },
          { value: 'none', label: 'Без армирования' },
        ],
        defaultValue: 'mesh',
      },
    ],
    calculate: (inputs) => {
      const area = parseFloat(inputs.area) || 0
      const thicknessOpt = [
        { value: '30', kgPerM2: 56 },
        { value: '40', kgPerM2: 75 },
        { value: '50', kgPerM2: 94 },
        { value: '70', kgPerM2: 130 },
      ].find(o => o.value === inputs.thickness) || { kgPerM2: 94 }

      const results = [
        {
          name: 'Сухая смесь для стяжки М-200',
          quantity: Math.ceil(area * thicknessOpt.kgPerM2 * 1.05),
          unit: 'кг',
          note: `${thicknessOpt.kgPerM2} кг/м² при толщине ${inputs.thickness} мм`,
          searchQuery: 'смесь стяжка пол',
          categoryId: 9,
        },
      ]

      if (inputs.reinforcement === 'mesh') {
        results.push({
          name: 'Арматурная сетка (100×100×3 мм)',
          quantity: parseFloat((area * 1.12).toFixed(1)),
          unit: 'м²',
          note: '12% запас на нахлёст',
          searchQuery: 'сетка арматурная',
          categoryId: null,
        })
      } else if (inputs.reinforcement === 'fiber') {
        results.push({
          name: 'Фиброволокно полипропиленовое',
          quantity: parseFloat((area * 0.3).toFixed(1)),
          unit: 'кг',
          note: '0.3 кг/м² для армирования',
          searchQuery: 'фиброволокно стяжка',
          categoryId: null,
        })
      }

      results.push({
        name: 'Демпферная лента',
        quantity: Math.ceil(Math.sqrt(area) * 4 * 1.1),
        unit: 'м',
        note: 'По периметру помещения',
        searchQuery: 'лента демпферная стяжка',
        categoryId: null,
      })

      return results
    },
  },

  paint: {
    id: 'paint',
    name: 'Покраска',
    icon: '🎨',
    description: 'Расчёт краски, грунтовки и инструмента',
    inputs: [
      { id: 'area', label: 'Площадь поверхности, м²', type: 'number', min: 1, max: 10000, step: 1, defaultValue: 50 },
      {
        id: 'surface', label: 'Тип поверхности', type: 'select',
        options: [
          { value: 'smooth', label: 'Ровная (гипсокартон, штукатурка)', consumption: 0.18 },
          { value: 'rough', label: 'Пористая (кирпич, газобетон)', consumption: 0.25 },
          { value: 'wood', label: 'Деревянная', consumption: 0.22 },
        ],
        defaultValue: 'smooth',
      },
      {
        id: 'coats', label: 'Количество слоёв', type: 'select',
        options: [
          { value: '1', label: '1 слой' },
          { value: '2', label: '2 слоя (рекомендуется)' },
          { value: '3', label: '3 слоя' },
        ],
        defaultValue: '2',
      },
    ],
    calculate: (inputs) => {
      const area = parseFloat(inputs.area) || 0
      const coats = parseInt(inputs.coats) || 2
      const surfaceOpt = [
        { value: 'smooth', consumption: 0.18 },
        { value: 'rough', consumption: 0.25 },
        { value: 'wood', consumption: 0.22 },
      ].find(o => o.value === inputs.surface) || { consumption: 0.18 }

      const paintVolume = parseFloat((area * surfaceOpt.consumption * coats).toFixed(1))
      const primerVolume = parseFloat((area * 0.14).toFixed(1))
      const rollerCount = Math.max(1, Math.ceil(area / 60))
      const trayCount = rollerCount

      return [
        {
          name: 'Краска (интерьерная)',
          quantity: paintVolume,
          unit: 'л',
          note: `${surfaceOpt.consumption} л/м² × ${coats} слоя`,
          searchQuery: 'краска интерьерная',
          categoryId: null,
        },
        {
          name: 'Грунтовка',
          quantity: primerVolume,
          unit: 'л',
          note: '0.14 л/м² перед покраской',
          searchQuery: 'грунтовка стены',
          categoryId: 9,
        },
        {
          name: 'Валик малярный',
          quantity: rollerCount,
          unit: 'шт',
          note: '1 шт на 60 м²',
          searchQuery: 'валик малярный',
          categoryId: null,
        },
        {
          name: 'Лоток малярный',
          quantity: trayCount,
          unit: 'шт',
          note: '',
          searchQuery: 'лоток малярный',
          categoryId: null,
        },
        {
          name: 'Кисть малярная',
          quantity: Math.max(1, Math.ceil(area / 100)),
          unit: 'шт',
          note: 'Для углов и стыков',
          searchQuery: 'кисть малярная',
          categoryId: null,
        },
      ]
    },
  },
}
