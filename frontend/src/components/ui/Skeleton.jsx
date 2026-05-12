'use client'

export default function Skeleton({ width, height, borderRadius = 6, style }) {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius,
        background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s infinite',
        ...style,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <Skeleton height={200} borderRadius={0} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={12} width="40%" />
        <Skeleton height={16} />
        <Skeleton height={16} width="80%" />
        <Skeleton height={20} width="50%" style={{ marginTop: 8 }} />
      </div>
    </div>
  )
}
