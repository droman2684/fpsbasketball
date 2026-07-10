import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import GamePlanSliders from '@renderer/components/dashboard/GamePlanSliders'
import type { BoxScorePlayerLine } from '@shared/types'

function quarterLabel(quarterIdx: number, otPeriods: number): string {
  if (quarterIdx === 0 && otPeriods === 0) return 'Tip-Off'
  if (quarterIdx < 4) return `End of Q${quarterIdx}`
  return `End of ${otPeriods === 1 ? 'OT' : `${otPeriods}OT`}`
}

function continueLabel(quarterIdx: number, otPeriods: number): string {
  if (quarterIdx < 4) return `Continue to Q${quarterIdx + 1} →`
  return `Continue to ${otPeriods === 0 ? 'OT' : `${otPeriods + 1}OT`} →`
}

function MiniLine({ p }: { p: BoxScorePlayerLine }): React.JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 32px 32px 32px',
        padding: '5px 12px',
        borderBottom: `1px solid ${COLORS.bg}`,
        gap: 4,
        alignItems: 'center'
      }}
    >
      <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textPrimary }}>{p.name}</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: COLORS.textPrimary, textAlign: 'center' }}>{p.pts}</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.reb}</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.ast}</span>
    </div>
  )
}

function MiniBoxScore({ label, players }: { label: string; players: BoxScorePlayerLine[] }): React.JSX.Element {
  const top = players.slice().sort((a, b) => b.pts - a.pts).slice(0, 5)
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, flex: 1 }}>
      <div style={{ padding: '8px 12px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 32px 32px 32px',
          padding: '5px 12px',
          fontFamily: FONTS.mono,
          fontSize: 8,
          color: COLORS.textFaint,
          gap: 4
        }}
      >
        <span>PLAYER</span>
        <span style={{ textAlign: 'center' }}>PTS</span>
        <span style={{ textAlign: 'center' }}>REB</span>
        <span style={{ textAlign: 'center' }}>AST</span>
      </div>
      {top.map((p, i) => (
        <MiniLine key={p.id ?? `${p.name}-${i}`} p={p} />
      ))}
    </div>
  )
}

export default function PlayGame(): React.JSX.Element {
  const liveGame = useGameStore((s) => s.liveGame)
  const gamePlan = useGameStore((s) => s.gamePlan)
  const setGamePlanField = useGameStore((s) => s.setGamePlanField)
  const advanceLiveGameQuarter = useGameStore((s) => s.advanceLiveGameQuarter)
  const callLiveGameTimeout = useGameStore((s) => s.callLiveGameTimeout)
  const myTeam = useGameStore((s) => s.myTeam)

  if (!liveGame) {
    return (
      <PageShell maxWidth={800}>
        <PageHeader title="Play Game" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NO GAME IN PROGRESS
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>
            A game plays out here once you choose "Play This Game" from the sim bar.
          </p>
        </div>
      </PageShell>
    )
  }

  const myPts = liveGame.mySide === 'home' ? liveGame.homePts : liveGame.awayPts
  const oppPts = liveGame.mySide === 'home' ? liveGame.awayPts : liveGame.homePts
  const myPreview = liveGame.mySide === 'home' ? liveGame.homePreview : liveGame.awayPreview
  const oppPreview = liveGame.mySide === 'home' ? liveGame.awayPreview : liveGame.homePreview
  const { quarterIdx, otPeriods } = liveGame.gameSimState

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Play Game" subtitle={`vs ${liveGame.opponentName}`} />

      <div
        style={{
          background: COLORS.sidebarDark,
          padding: '24px 32px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#8A8A86', letterSpacing: 2, marginBottom: 4 }}>{myTeam}</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: 'white', lineHeight: 1 }}>{myPts}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.accent, letterSpacing: 2, textTransform: 'uppercase' }}>
            {quarterLabel(quarterIdx, otPeriods)}
          </div>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#8A8A86', letterSpacing: 2, marginBottom: 4 }}>
            {liveGame.opponent}
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: '#8A8A86', lineHeight: 1 }}>{oppPts}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <MiniBoxScore label={myTeam} players={myPreview} />
        <MiniBoxScore label={liveGame.opponent} players={oppPreview} />
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 15, marginBottom: 16, letterSpacing: 1 }}>
          ADJUST GAME PLAN
        </div>
        <GamePlanSliders gamePlan={gamePlan} onChange={setGamePlanField} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={callLiveGameTimeout}
          disabled={liveGame.timeoutsRemaining <= 0}
          style={{
            padding: '12px 20px',
            background: liveGame.timeoutsRemaining > 0 ? '#1E1E1B' : '#D8D6D1',
            color: liveGame.timeoutsRemaining > 0 ? 'white' : '#9A9894',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: liveGame.timeoutsRemaining > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Call Timeout ({liveGame.timeoutsRemaining})
        </button>
        <button
          onClick={advanceLiveGameQuarter}
          className="cta-btn"
          style={{
            padding: '12px 26px',
            background: COLORS.accent,
            color: 'white',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          {continueLabel(quarterIdx, otPeriods)}
        </button>
      </div>
    </PageShell>
  )
}
