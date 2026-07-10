import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor, seg } from '@renderer/styles/theme'

const FOCUS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'shooting', label: 'Shooting' },
  { key: 'athleticism', label: 'Athleticism' },
  { key: 'iq', label: 'Basketball IQ' },
  { key: 'defense', label: 'Defense' },
  { key: 'passing', label: 'Passing' }
]

const FOCUS_LABELS: Record<string, string> = Object.fromEntries(FOCUS_OPTIONS.map((f) => [f.key, f.label]))

export default function Development(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const devFocus = useGameStore((s) => s.devFocus)
  const setDevFocus = useGameStore((s) => s.setDevFocus)

  const devPlayers = myRoster.filter((p) => p.age <= 24)

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Player Development" subtitle="Assign training focus for young players (age 25 and under)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {devPlayers.map((p, i) => {
          const focus = devFocus[i] || 'shooting'
          const focusLabel = FOCUS_LABELS[focus] || focus
          return (
            <div key={p.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: ovrColor(p.ovr) }}>
                      {p.ovr}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2 }}>
                      {p.pos} · Age {p.age} · Potential: {p.potential} OVR (
                      {Math.round((p.ovr / p.potential) * 100)}%)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', width: 90, height: 4, background: COLORS.bg, overflow: 'hidden', marginTop: 4 }}>
                      <div
                        style={{
                          height: '100%',
                          background: COLORS.accent,
                          width: `${Math.min(100, Math.round((p.ovr / p.potential) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'right' }}>
                  Focus: <strong style={{ color: COLORS.accent }}>{focusLabel}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FOCUS_OPTIONS.map((fb) => {
                  const active = focus === fb.key
                  return (
                    <button
                      key={fb.key}
                      onClick={() => setDevFocus(i, fb.key)}
                      style={{
                        padding: '6px 14px',
                        background: seg.bg(active),
                        color: seg.fg(active),
                        border: `1px solid ${seg.border(active)}`,
                        fontFamily: FONTS.display,
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: 1,
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {fb.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
