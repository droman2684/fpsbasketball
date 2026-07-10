import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { MONTHS } from '@renderer/data/players'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

export default function Schedule(): React.JSX.Element {
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const myTeam = useGameStore((s) => s.myTeam)
  const records = useGameStore((s) => s.records)
  const config = useGameStore((s) => s.config)
  const simResults = useGameStore((s) => s.simResults)
  const calendar = useGameStore((s) => s.calendar)
  const simDay = useGameStore((s) => s.simDay)
  const seasonNumber = useGameStore((s) => s.seasonNumber)

  const rec = records[myTeam] ?? { w: 0, l: 0, l10: '0-0' }
  const gamesPerSeason = config?.gamesPerSeason ?? 82

  const upcomingGames = calendar.games
    .filter((g) => (g.home === myTeam || g.away === myTeam) && g.day > simDay)
    .slice(0, 8)

  return (
    <PageShell maxWidth={900}>
      <PageHeader
        title={`${myTeam} Schedule`}
        subtitle={`Season ${seasonNumber} · ${gamesPerSeason} games · Record: ${rec.w}-${rec.l}`}
      />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden', marginBottom: 16 }}>
        {simResults.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center', fontFamily: FONTS.body, fontSize: 14, color: COLORS.textMuted }}>
            No games played yet.
          </div>
        ) : (
          simResults.map((g, i) => {
            const oppTeam = leagueTeams.find((t) => t.abbr === g.opp)
            const resultColor = g.won ? COLORS.winGreen : COLORS.textFaint
            return (
              <div
                key={`${g.opp}-${g.m}-${g.d}-${i}`}
                className="hover-fade"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 18px',
                  borderBottom: `1px solid ${COLORS.bg}`,
                  background: g.won ? 'oklch(0.99 0.005 140)' : COLORS.surface
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 64, flexShrink: 0 }}>
                    {(MONTHS[g.m - 1] ?? '').toUpperCase()} {g.d}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: oppTeam?.primary ?? COLORS.textFaint }} />
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 13,
                        fontWeight: g.won ? 600 : 400,
                        color: COLORS.textPrimary
                      }}
                    >
                      {oppTeam?.city ?? g.opp}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textPrimary, fontWeight: 500 }}>
                    {g.myPts}–{g.oppPts}
                  </span>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: resultColor, width: 12 }}>
                    {g.won ? 'W' : 'L'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '14px 18px' }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 8,
            color: COLORS.textFaint,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 6
          }}
        >
          Upcoming
        </div>
        {upcomingGames.length === 0 ? (
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>
            No games remaining on the schedule.
          </p>
        ) : (
          upcomingGames.map((g, i) => {
            const isHome = g.home === myTeam
            const opp = isHome ? g.away : g.home
            const oppTeam = leagueTeams.find((t) => t.abbr === opp)
            return (
              <div
                key={`${g.day}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: `1px solid ${COLORS.bg}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 56, flexShrink: 0 }}>
                    {(MONTHS[g.date.m - 1] ?? '').toUpperCase()} {g.date.d}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: oppTeam?.primary ?? COLORS.textFaint }} />
                    <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textPrimary }}>
                      {isHome ? 'vs' : '@'} {oppTeam?.city ?? opp}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </PageShell>
  )
}
