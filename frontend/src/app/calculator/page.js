'use client'
import { useState } from 'react'
import { CALCULATORS } from '@/data/calculator'
import CalculatorTypePicker from '@/components/calculator/CalculatorTypePicker'
import CalculatorForm from '@/components/calculator/CalculatorForm'
import CalculatorResults from '@/components/calculator/CalculatorResults'

export default function CalculatorPage() {
  const [selectedCalcId, setSelectedCalcId] = useState(null)
  const [results, setResults] = useState(null)

  const handleCalcSelect = (id) => {
    setSelectedCalcId(id)
    setResults(null)
  }

  const handleCalculate = (materials) => {
    setResults(materials)
  }

  const calc = selectedCalcId ? CALCULATORS[selectedCalcId] : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
          Калькулятор материалов
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
          Рассчитайте точное количество материалов для вашего проекта, подберите товары из каталога и добавьте их в корзину.
        </p>
      </div>

      {/* Step 1: Type picker */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Шаг 1 — Выберите тип работ
        </h2>
        <CalculatorTypePicker selected={selectedCalcId} onSelect={handleCalcSelect} />
      </section>

      {calc && (
        <div style={{ display: 'grid', gridTemplateColumns: results ? '1fr 2fr' : '1fr', gap: 32 }} className="calc-layout">
          {/* Step 2: Form */}
          <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
              {calc.icon} {calc.name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {calc.description}
            </p>
            <CalculatorForm calcId={selectedCalcId} onCalculate={handleCalculate} />
          </section>

          {/* Step 3: Results */}
          {results && (
            <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
              <CalculatorResults materials={results} />
            </section>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 767px) { .calc-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
