import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
}

// The "← Dashboard" back link + big Barlow Condensed title that starts every
// dashboard sub-page in the design spec.
export default function PageHeader({ title, subtitle }: PageHeaderProps): React.JSX.Element {
  const goHome = useGameStore((s) => s.goHome)
  const [hover, setHover] = useState(false)

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={goHome}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'none',
          border: 'none',
          color: hover ? COLORS.textMuted : COLORS.textFaint,
          cursor: 'pointer',
          fontSize: 12,
          padding: '0 0 6px',
          fontFamily: FONTS.body
        }}
      >
        ← Dashboard
      </button>
      <h1
        style={{
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 42,
          color: COLORS.textPrimary,
          letterSpacing: -1,
          lineHeight: 1
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{subtitle}</p>
      ) : null}
    </div>
  )
}
