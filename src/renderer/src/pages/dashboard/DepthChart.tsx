import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { RosterPlayer } from '@shared/types'

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
const DEPTH_LABELS = ['STARTER', 'BACKUP', '3RD']

export default function DepthChart(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)

  const depthChart = POSITIONS.map((pos) => {
    const players = [...myRoster].filter((p) => p.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, 3)
    return { position: pos, players }
  })

  return (
    <PageShell maxWidth={1200}>
      <PageHeader title="Depth Chart" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {depthChart.map((col) => (
          <div key={col.position} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <div style={{ background: COLORS.sidebarDark, padding: '10px 14px' }}>
              <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 18, color: COLORS.accent, letterSpacing: 2 }}>
                {col.position}
              </span>
            </div>
            {col.players.map((p: RosterPlayer, i: number) => (
              <div
                key={p.id}
                style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${COLORS.bg}`,
                  background: i === 0 ? 'oklch(0.99 0.008 42)' : COLORS.surface
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: COLORS.textFaint,
                    letterSpacing: 2,
                    marginBottom: 3,
                    textTransform: 'uppercase'
                  }}
                >
                  {DEPTH_LABELS[i] ?? 'BENCH'}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: i === 0 ? COLORS.textPrimary : COLORS.textMuted
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 900, color: ovrColor(p.ovr), marginTop: 1 }}>
                  {p.ovr}{' '}
                  <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.textFaint, fontFamily: FONTS.mono }}>OVR</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PageShell>
  )
}
