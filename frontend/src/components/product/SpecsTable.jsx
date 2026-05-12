'use client'
import { decodeEntities } from '@/utils/decodeEntities'

const fixedFields = [
  { key: 'weight',        label: 'Масса', unit: 'кг' },
  { key: 'power_cold',    label: 'Мощность охлаждения', unit: 'кВт' },
  { key: 'power_heat',    label: 'Мощность обогрева', unit: 'кВт' },
  { key: 'air_flow',      label: 'Воздухообмен', unit: 'м³/ч' },
  { key: 'size_internal', label: 'Габариты (внутр. блок)', unit: 'мм' },
  { key: 'size_external', label: 'Габариты (внешн. блок)', unit: 'мм' },
]

export default function SpecsTable({ product, specifications = [] }) {
  const fixedRows = fixedFields.filter(f => product?.[f.key] != null)

  if (!fixedRows.length && !specifications.length) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Характеристики не указаны</div>
  }

  const allRows = [
    ...fixedRows.map(f => ({ name: f.label, value: String(product[f.key]), unit: f.unit })),
    ...specifications.map(s => ({ name: decodeEntities(s.NAME), value: decodeEntities(s.VALUE), unit: s.unit })),
  ]

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {allRows.map((row, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <td style={{ padding: '10px 16px 10px 0', color: 'var(--text-muted)', fontSize: 13, width: '50%' }}>{row.name}</td>
            <td style={{ padding: '10px 0', color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
              {row.value}{row.unit ? ` ${row.unit}` : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
