import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { RuleFlags } from '@shared/types'

interface ToggleDef {
  key: keyof RuleFlags
  label: string
  desc: string
}

const TOGGLES: ToggleDef[] = [
  { key: 'overtime', label: '5-Minute Overtime', desc: 'STANDARD OT PERIOD — TOGGLE FOR SHOOTOUT FORMAT' },
  { key: 'challenge', label: 'Coach Challenge', desc: 'ONE CHALLENGE PER GAME, SUCCESSFUL = RETAINED' },
  { key: 'shotClock24', label: '24-Second Shot Clock', desc: 'DISABLE FOR 30-SECOND ALTERNATIVE' },
  { key: 'playIn', label: 'Play-In Tournament', desc: 'SEEDS 7-10 COMPETE FOR FINAL PLAYOFF SPOTS' },
  { key: 'loadMgmt', label: 'Load Management Penalty', desc: 'FINE TEAMS FOR RESTING STARS IN MARQUEE GAMES' },
  { key: 'twoWay', label: 'Two-Way Contracts', desc: 'ALLOW TWO-WAY G LEAGUE ASSIGNMENTS' }
]

export default function RuleChanges(): React.JSX.Element {
  const ruleFlags = useGameStore((s) => s.ruleFlags)
  const toggleRule = useGameStore((s) => s.toggleRule)

  return (
    <PageShell maxWidth={800}>
      <PageHeader title="Rule Changes" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        {TOGGLES.map((r) => {
          const active = ruleFlags[r.key]
          return (
            <div
              key={r.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: `1px solid ${COLORS.bg}`
              }}
            >
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{r.label}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2, letterSpacing: 1 }}>
                  {r.desc}
                </div>
              </div>
              <button
                onClick={() => toggleRule(r.key)}
                style={{
                  flexShrink: 0,
                  marginLeft: 20,
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: active ? COLORS.accent : '#2A2A26',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    left: active ? 25 : 3,
                    transition: 'left 0.2s'
                  }}
                />
              </button>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
