import { COLORS, FONTS } from '@renderer/styles/theme'
import type { GamePlanConfig } from '@shared/types'

interface SliderSpec {
  key: keyof GamePlanConfig
  label: string
  low: string
  high: string
}

// Order + copy ported verbatim from the design handoff's `gamePlanSliders`.
// Shared by the standalone Game Plan page and the in-game Play Game
// checkpoint screen, so both edit the exact same slider set identically.
export const GAME_PLAN_SLIDERS: SliderSpec[] = [
  { key: 'pace', label: 'Pace', low: 'Halfcourt', high: 'Run & Gun' },
  { key: 'threePoint', label: '3PT Frequency', low: 'Post Focused', high: 'Three Heavy' },
  { key: 'post', label: 'Post Play', low: 'Perimeter', high: 'Interior' },
  { key: 'defense', label: 'Defensive Intensity', low: 'Conservative', high: 'Aggressive' },
  { key: 'fastBreak', label: 'Fast Break', low: 'Set Offense', high: 'Push Tempo' },
  { key: 'ballMovement', label: 'Ball Movement', low: 'Isolation', high: 'Ball Movement' }
]

export default function GamePlanSliders({
  gamePlan,
  onChange
}: {
  gamePlan: GamePlanConfig
  onChange: (key: keyof GamePlanConfig, value: number) => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {GAME_PLAN_SLIDERS.map((s) => (
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
            onChange={(e) => onChange(s.key, Number(e.target.value))}
          />
        </div>
      ))}
    </div>
  )
}
