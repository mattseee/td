'use client'
import Link from 'next/link'

export default function Logo({ size = 'md', href = '/', textColor }) {
  const circleSize = size === 'sm' ? 28 : 36
  const fontSize   = size === 'sm' ? 14 : 18
  const circleFontSize = size === 'sm' ? 10 : 13

  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, alignSelf: 'center' }}>
      <div style={{
        width: circleSize, height: circleSize,
        borderRadius: '50%',
        background: '#EF4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: circleFontSize, letterSpacing: 0 }}>ТД</span>
      </div>
      <span style={{
        color: textColor || 'var(--brand-navy)',
        fontWeight: 700,
        fontSize,
        letterSpacing: '0.5px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        ТД СТОК
      </span>
    </Link>
  )
}
