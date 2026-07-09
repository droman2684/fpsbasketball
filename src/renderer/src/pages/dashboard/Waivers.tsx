import { useGameStore } from '@renderer/state/gameStore'
import { fmt$ } from '@renderer/data/engine'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const GRID_COLS = '1fr 48px 48px 52px 52px 52px 100px 100px'

const headerCellStyle = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

export default function Waivers(): React.JSX.Element {
  const waiverPool = useGameStore((s) => s.waiverPool)
  const claimWaiver = useGameStore((s) => s.claimWaiver)

  return (
    <PageShell maxWidth={1100}>
      <PageHeader title="Waiver Wire" subtitle="Minimum contract players available" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            padding: '7px 18px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 4
          }}
        >
          <span style={{ ...headerCellStyle, letterSpacing: 1 }}>NAME</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>POS</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>AGE</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>OVR</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>PPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>RPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>CONTRACT</span>
          <span></span>
        </div>
        {waiverPool.map((p) => (
          <div
            key={p.id}
            className="hover-row"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLS,
              padding: '10px 18px',
              borderBottom: `1px solid ${COLORS.bg}`,
              gap: 4,
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>Available</div>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.age}</span>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 15, color: ovrColor(p.ovr), textAlign: 'center' }}>
              {p.ovr}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textPrimary, textAlign: 'center' }}>{p.pts}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.reb}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, textAlign: 'right' }}>{fmt$(p.salary)}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => claimWaiver(p.id)}
                className="hover-accent-fill"
                style={{
                  padding: '5px 12px',
                  background: COLORS.surface,
                  color: COLORS.accent,
                  border: `1.5px solid ${COLORS.accent}`,
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Claim
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
