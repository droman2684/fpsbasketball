import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import GamePlanSliders from '@renderer/components/dashboard/GamePlanSliders'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS } from '@renderer/styles/theme'

export default function GamePlan(): React.JSX.Element {
  const gamePlan = useGameStore((s) => s.gamePlan)
  const setGamePlanField = useGameStore((s) => s.setGamePlanField)

  const paceStr = gamePlan.pace > 65 ? 'Up-Tempo' : gamePlan.pace < 45 ? 'Slow Pace' : 'Balanced'
  const offStr = gamePlan.threePoint > 55 ? '3PT Focused' : gamePlan.post > 60 ? 'Post Attack' : 'Balanced Offense'
  const defStr = gamePlan.defense > 65 ? 'High Pressure' : 'Standard Defense'
  const gamePlanStyle = `${paceStr} · ${offStr} · ${defStr}`

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
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 28 }}>
        <GamePlanSliders gamePlan={gamePlan} onChange={setGamePlanField} />
      </div>
    </PageShell>
  )
}
