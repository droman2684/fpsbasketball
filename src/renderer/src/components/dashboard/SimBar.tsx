import { useGameStore } from '@renderer/state/gameStore'
import { MONTHS } from '@renderer/data/players'
import { TEAM_DATA } from '@renderer/data/teams'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'

export default function SimBar(): React.JSX.Element {
  const simDay = useGameStore((s) => s.simDay)
  const simDate = useGameStore((s) => s.simDate)
  const config = useGameStore((s) => s.config)
  const simResults = useGameStore((s) => s.simResults)
  const myTeam = useGameStore((s) => s.myTeam)
  const records = useGameStore((s) => s.records)
  const simDay1 = useGameStore((s) => s.simDay1)
  const simWeek1 = useGameStore((s) => s.simWeek1)
  const simMonth1 = useGameStore((s) => s.simMonth1)
  const simPlayoffs1Day = useGameStore((s) => s.simPlayoffs1Day)
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const seasonNumber = useGameStore((s) => s.seasonNumber)
  const goToPage = useGameStore((s) => s.goToPage)

  const gamesPerSeason = config?.gamesPerSeason ?? 82
  const simDateStr = `${MONTHS[simDate.m - 1]} ${simDate.d}, ${simDate.y}`

  const simPlayoffsWeek = (): void => {
    for (let i = 0; i < 7; i++) simPlayoffs1Day()
  }
  const simPlayoffsMonth = (): void => {
    for (let i = 0; i < 30; i++) simPlayoffs1Day()
  }

  const latestNews =
    simResults.length > 0
      ? `${simResults[0].won ? 'W' : 'L'} ${simResults[0].myPts}–${simResults[0].oppPts} vs ${simResults[0].opp} · ${MONTHS[simResults[0].m - 1]} ${simResults[0].d}`
      : 'Simulation not started — press SIM DAY to advance the season'

  const team = TEAM_DATA[myTeam]
  const primary = team?.primary ?? '#552583'
  const textColor = getTextColor(primary)
  const record = records[myTeam]
  const recordStr = record ? `${record.w}–${record.l}` : '0–0'

  const dividerStyle = { width: 1, height: 22, background: '#1E1E1B', flexShrink: 0 } as const

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.navDark,
        borderTop: '1px solid #1E1E1B',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        zIndex: 200
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9,
            color: '#4A4A46',
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          S{seasonNumber} &middot; D{simDay}/{gamesPerSeason}
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#767672', letterSpacing: 1, fontWeight: 500 }}>
          {simDateStr}
        </span>
      </div>
      <div style={dividerStyle} />
      {seasonPhase === 'offseason' ? (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => goToPage('offseason')}
            className="hover-dim"
            style={{
              padding: '6px 14px',
              background: COLORS.accent,
              color: 'white',
              border: 'none',
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Go to Offseason Hub
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={seasonPhase === 'playoffs' ? simPlayoffs1Day : simDay1}
            className="hover-dim"
            style={{
              padding: '6px 14px',
              background: COLORS.accent,
              color: 'white',
              border: 'none',
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            {seasonPhase === 'playoffs' ? 'SIM GAME' : 'SIM DAY'}
          </button>
          <button
            onClick={seasonPhase === 'playoffs' ? simPlayoffsWeek : simWeek1}
            className="hover-simbtn"
            style={{
              padding: '6px 14px',
              background: '#1E1E1B',
              color: '#AEACA8',
              border: '1px solid #2A2A26',
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            SIM WEEK
          </button>
          <button
            onClick={seasonPhase === 'playoffs' ? simPlayoffsMonth : simMonth1}
            className="hover-simbtn"
            style={{
              padding: '6px 14px',
              background: '#1E1E1B',
              color: '#AEACA8',
              border: '1px solid #2A2A26',
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            SIM MONTH
          </button>
        </div>
      )}
      <div style={dividerStyle} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 8,
            color: '#4A4A46',
            letterSpacing: 2,
            textTransform: 'uppercase',
            flexShrink: 0
          }}
        >
          Latest
        </span>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 13,
            color: '#767672',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {latestNews}
        </span>
      </div>
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          paddingLeft: 14,
          borderLeft: '1px solid #1E1E1B'
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 8, color: textColor }}>{myTeam}</span>
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 500, color: 'white', letterSpacing: 1 }}>
          {recordStr}
        </span>
      </div>
    </div>
  )
}
