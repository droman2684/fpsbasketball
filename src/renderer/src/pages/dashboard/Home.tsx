import type { CSSProperties } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, seg } from '@renderer/styles/theme'
import { buildStandings, type StandingRow } from '@renderer/data/engine'
import { buildLeagueLeaderboard } from '@renderer/data/leaders'
import { MONTHS } from '@renderer/data/players'

const STANDINGS_GRID = '20px 1fr 32px 32px 48px 44px 44px'

const headerCellStyle: CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

function StandingsRows({ rows }: { rows: StandingRow[] }): React.JSX.Element {
  return (
    <>
      {rows.map((t) => (
        <div key={t.abbr}>
          {t.playoffCut ? <div style={{ borderTop: '1.5px dashed oklch(0.62 0.21 42)' }} /> : null}
          {t.playInCut ? <div style={{ borderTop: '1px dashed #D0CEC9' }} /> : null}
          <div
            className="hover-fade"
            style={{
              display: 'grid',
              gridTemplateColumns: STANDINGS_GRID,
              padding: '7px 16px',
              borderBottom: `1px solid ${COLORS.bg}`,
              background: t.rowBg
            }}
          >
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: t.rankColor, display: 'flex', alignItems: 'center' }}>
              {t.rank}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.primary, flexShrink: 0 }} />
              <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: t.fw, color: t.nameColor }}>{t.city}</span>
            </div>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                fontWeight: 600,
                textAlign: 'center',
                color: t.nameColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t.w}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                textAlign: 'center',
                color: COLORS.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t.l}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                textAlign: 'right',
                color: t.nameColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              {t.pct}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 11,
                textAlign: 'right',
                color: COLORS.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              {t.gb}
            </span>
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                textAlign: 'right',
                color: COLORS.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
            >
              {t.l10}
            </span>
          </div>
        </div>
      ))}
    </>
  )
}

export default function Home(): React.JSX.Element {
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const myTeam = useGameStore((s) => s.myTeam)
  const myRoster = useGameStore((s) => s.myRoster)
  const rosters = useGameStore((s) => s.rosters)
  const config = useGameStore((s) => s.config)
  const conf = useGameStore((s) => s.conf)
  const setConf = useGameStore((s) => s.setConf)
  const simResults = useGameStore((s) => s.simResults)
  const calendar = useGameStore((s) => s.calendar)
  const simDay = useGameStore((s) => s.simDay)

  const upcomingGames = calendar.games
    .filter((g) => (g.home === myTeam || g.away === myTeam) && g.day > simDay)
    .slice(0, 5)

  const confIndexes = Array.from(new Set(leagueTeams.map((t) => t.confIndex))).sort((a, b) => a - b)
  const twoConf = confIndexes.length === 2
  const playoffSpots = config?.playoffTeamsPerConf ?? 8

  const confLabel = (idx: number): string =>
    config?.conferences[idx]?.name || (idx === 0 ? 'Conference A' : idx === 1 ? 'Conference B' : `Conference ${idx + 1}`)

  const leaguePlayers = buildLeagueLeaderboard(myTeam, myRoster, rosters, leagueTeams)
  const hotPlayers = [...leaguePlayers].sort((a, b) => b.pts - a.pts).slice(0, 5)
  const coldPlayers = [...leaguePlayers].sort((a, b) => a.pts - b.pts).slice(0, 5)

  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '2fr 1.4fr 1fr',
        gap: 16,
        alignItems: 'start'
      }}
      className="pg"
    >
      {/* Standings card */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
            Standings
          </h2>
          {twoConf ? (
            <div style={{ display: 'flex', gap: 0 }}>
              {[0, 1].map((idx) => {
                const active = conf === idx
                return (
                  <button
                    key={idx}
                    onClick={() => setConf(idx as 0 | 1)}
                    style={{
                      padding: '4px 12px',
                      background: seg.bg(active),
                      color: seg.fg(active),
                      border: `1px solid ${seg.border(active)}`,
                      fontFamily: FONTS.display,
                      fontWeight: 800,
                      fontSize: 11,
                      letterSpacing: 1,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      marginRight: idx === 0 ? -1 : 0,
                      position: 'relative',
                      zIndex: seg.z(active)
                    }}
                  >
                    {confLabel(idx)}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: STANDINGS_GRID,
            padding: '6px 16px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`
          }}
        >
          <span />
          <span style={{ ...headerCellStyle, letterSpacing: 2 }}>TEAM</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>W</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>L</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>PCT</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>GB</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>L10</span>
        </div>
        {twoConf ? (
          <StandingsRows rows={buildStandings(leagueTeams, records, conf, myTeam, playoffSpots)} />
        ) : (
          confIndexes.map((idx) => (
            <div key={idx}>
              <div style={{ padding: '5px 16px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                <span
                  style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint, letterSpacing: 1, textTransform: 'uppercase' }}
                >
                  {confLabel(idx)}
                </span>
              </div>
              <StandingsRows rows={buildStandings(leagueTeams, records, idx, myTeam, playoffSpots)} />
            </div>
          ))
        )}
        <div style={{ padding: '7px 16px', background: COLORS.bg, display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 0, borderTop: '1.5px dashed oklch(0.62 0.21 42)' }} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>Playoff</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 16, height: 0, borderTop: '1px dashed #C0BEB9' }} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>Play-In</span>
          </div>
        </div>
      </div>

      {/* Schedule card */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
            Schedule
          </h2>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint, letterSpacing: 2, textTransform: 'uppercase' }}>
            {myTeam}
          </span>
        </div>
        <div style={{ padding: '10px 16px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.textFaint,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            Recent
          </div>
          {simResults.length === 0 ? (
            <div style={{ padding: '9px 0', fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>No games played yet.</div>
          ) : (
            simResults.slice(0, 5).map((g, i) => {
              const oppTeam = leagueTeams.find((t) => t.abbr === g.opp)
              const dot = g.won ? 'oklch(0.50 0.17 140)' : '#C0BEB9'
              const resultColor = g.won ? 'oklch(0.45 0.17 140)' : '#AEACA8'
              return (
                <div
                  key={`${g.opp}-${g.m}-${g.d}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: `1px solid ${COLORS.bg}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: dot }} />
                    <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 48, flexShrink: 0 }}>
                      {(MONTHS[g.m - 1] ?? '').toUpperCase()} {g.d}
                    </span>
                    <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: COLORS.textPrimary }}>
                      {oppTeam?.city ?? g.opp}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>
                      {g.myPts}–{g.oppPts}
                    </span>
                    <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 12, color: resultColor, width: 11 }}>
                      {g.won ? 'W' : 'L'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.textFaint,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            Upcoming
          </div>
          {upcomingGames.length === 0 ? (
            <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, padding: '9px 0' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: oppTeam?.primary ?? COLORS.textFaint }} />
                    <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 48, flexShrink: 0 }}>
                      {(MONTHS[g.date.m - 1] ?? '').toUpperCase()} {g.date.d}
                    </span>
                    <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: COLORS.textPrimary }}>
                      {isHome ? 'vs' : '@'} {oppTeam?.city ?? opp}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Hot/Cold */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div
            style={{ padding: '11px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="4" fill="oklch(0.62 0.21 42)" />
            </svg>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: 'oklch(0.55 0.21 42)'
              }}
            >
              Who&apos;s Hot
            </h2>
          </div>
          {hotPlayers.map((p) => (
            <div key={`${p.team}-${p.name}`} style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.bg}`, background: 'oklch(0.988 0.008 42)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.teamPrimary }} />
                <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: '#C0BEB9' }}>
                  {p.team} · {p.pos}
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textMuted }}>
                  {p.pts.toFixed(1)} PPG · {p.reb.toFixed(1)} RPG
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div
            style={{ padding: '11px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="4" fill="#B0AEA9" />
            </svg>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: COLORS.textMuted
              }}
            >
              Who&apos;s Not
            </h2>
          </div>
          {coldPlayers.map((p) => (
            <div key={`${p.team}-${p.name}`} style={{ padding: '9px 14px', borderBottom: `1px solid ${COLORS.bg}`, background: 'oklch(0.977 0.003 240)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.teamPrimary }} />
                <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: '#C0BEB9' }}>
                  {p.team} · {p.pos}
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textMuted }}>
                  {p.pts.toFixed(1)} PPG · {p.reb.toFixed(1)} RPG
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
