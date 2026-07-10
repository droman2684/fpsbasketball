import type { CSSProperties } from 'react'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import type { GamePlanConfig } from '@shared/types'

interface SliderSpec {
  key: keyof GamePlanConfig
  label: string
  low: string
  high: string
}

// Order + copy ported verbatim from the design handoff's `gamePlanSliders`.
const SLIDERS: SliderSpec[] = [
  { key: 'pace', label: 'Pace', low: 'Halfcourt', high: 'Run & Gun' },
  { key: 'threePoint', label: '3PT Frequency', low: 'Post Focused', high: 'Three Heavy' },
  { key: 'post', label: 'Post Play', low: 'Perimeter', high: 'Interior' },
  { key: 'defense', label: 'Defensive Intensity', low: 'Conservative', high: 'Aggressive' },
  { key: 'fastBreak', label: 'Fast Break', low: 'Set Offense', high: 'Push Tempo' },
  { key: 'ballMovement', label: 'Ball Movement', low: 'Isolation', high: 'Ball Movement' }
]

export default function GamePlan(): React.JSX.Element {
  const gamePlan = useGameStore((s) => s.gamePlan)
  const setGamePlanField = useGameStore((s) => s.setGamePlanField)

  const paceStr = gamePlan.pace > 65 ? 'Up-Tempo' : gamePlan.pace < 45 ? 'Slow Pace' : 'Balanced'
  const offStr = gamePlan.threePoint > 55 ? '3PT Focused' : gamePlan.post > 60 ? 'Post Attack' : 'Balanced Offense'
  const defStr = gamePlan.defense > 65 ? 'High Pressure' : 'Standard Defense'
  const gamePlanStyle = `${paceStr} · ${offStr} · ${defStr}`

  const cardStyle: CSSProperties = {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 28
  }

  return (
    <PageShell maxWidth={780}>
      <PageHeader
        title="Game Plan"
        subtitle={
          <>
            Style: <strong style={{ color: COLORS.accent }}>{gamePlanStyle}</strong>
          </>
        }
      />
      <div style={cardStyle}>
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 10
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 800,
                    fontSize: 16,
                    color: COLORS.textPrimary,
                    letterSpacing: 0.5
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2 }}>
                  {s.low} ← → {s.high}
                </div>
              </div>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 28,
                  fontWeight: 900,
                  color: COLORS.accent,
                  lineHeight: 1
                }}
              >
                {gamePlan[s.key]}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={gamePlan[s.key]}
              onChange={(e) => setGamePlanField(s.key, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
