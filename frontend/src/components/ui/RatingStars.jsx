'use client'

export default function RatingStars({ value = 0, max = 5, size = 16, interactive, onChange }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value)
        return (
          <span
            key={i}
            onClick={() => interactive && onChange?.(i + 1)}
            style={{
              fontSize: size,
              color: filled ? 'var(--accent)' : 'var(--border)',
              cursor: interactive ? 'pointer' : 'default',
              lineHeight: 1,
              transition: 'color 0.1s',
            }}
          >★</span>
        )
      })}
    </span>
  )
}
