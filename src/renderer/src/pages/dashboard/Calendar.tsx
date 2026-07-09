import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { MONTHS } from '@renderer/data/players'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { ScheduledGame, SimDate } from '@shared/types'

// Small local date-math helper — the engine's own addDays isn't exported, but
// all we need here is "nudge a SimDate by N calendar days," which native Date
// handles fine for display purposes.
function addDaysLocal(date: SimDate, n: number): SimDate {
  const d = new Date(date.y, date.m - 1, date.d)
  d.setDate(d.getDate() + n)
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
}

// The calendar's games array has no entry for a given "day" number when that
// day is an off day (e.g. the All-Star break) — walk to the nearest adjacent
// game day and offset by one to recover an approximate date.
function dateForDay(games: ScheduledGame[], day: number): SimDate | null {
  if (games.length === 0 || day <= 0) return null
  const exact = games.find((g) => g.day === day)
  if (exact) return exact.date
  const before = games.find((g) => g.day === day - 1)
  if (before) return addDaysLocal(before.date, 1)
  const after = games.find((g) => g.day === day + 1)
  if (after) return addDaysLocal(after.date, -1)
  return null
}

function fmtDate(date: SimDate | null): string {
  if (!date) return '—'
  return `${MONTHS[date.m - 1]} ${date.d}, ${date.y}`
}

function monthKey(date: SimDate): string {
  return `${date.y}-${date.m}`
}
function monthLabel(date: SimDate): string {
  return `${MONTHS[date.m - 1].toUpperCase()} ${date.y}`
}

interface Milestone {
  label: string
  detail?: string
  dateStr: string
  accent?: boolean
}

interface MonthBucket {
  key: string
  label: string
  sortKey: number
  games: ScheduledGame[]
  milestones: Milestone[]
}

const ROUND_NAMES = ['Round 1', 'Round 2', 'Conference Finals', 'Finals']

export default function Calendar(): React.JSX.Element {
  const calendar = useGameStore((s) => s.calendar)
  const myTeam = useGameStore((s) => s.myTeam)
  const seasonNumber = useGameStore((s) => s.seasonNumber)
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const playoffs = useGameStore((s) => s.playoffs)
  const draftPhase = useGameStore((s) => s.draftPhase)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const config = useGameStore((s) => s.config)

  const games = calendar.games
  const startDate = games[0]?.date ?? null
  const allStarDate = dateForDay(games, calendar.allStarDay)
  const endDate = dateForDay(games, calendar.seasonEndDay)

  const monthMap = new Map<string, MonthBucket>()
  function bucketFor(date: SimDate): MonthBucket {
    const key = monthKey(date)
    let b = monthMap.get(key)
    if (!b) {
      b = { key, label: monthLabel(date), sortKey: date.y * 12 + date.m, games: [], milestones: [] }
      monthMap.set(key, b)
    }
    return b
  }

  games
    .filter((g) => g.home === myTeam || g.away === myTeam)
    .forEach((g) => bucketFor(g.date).games.push(g))

  if (startDate) bucketFor(startDate).milestones.push({ label: `Season ${seasonNumber} begins`, dateStr: fmtDate(startDate), accent: true })
  if (allStarDate) bucketFor(allStarDate).milestones.push({ label: 'All-Star Game', dateStr: fmtDate(allStarDate) })
  if (endDate) bucketFor(endDate).milestones.push({ label: 'Regular season ends', dateStr: fmtDate(endDate) })

  const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.sortKey - b.sortKey)

  function teamCity(abbr: string): string {
    const t = leagueTeams.find((x) => x.abbr === abbr)
    return t ? t.city : abbr
  }
  function teamColor(abbr: string): string {
    return leagueTeams.find((x) => x.abbr === abbr)?.primary ?? COLORS.textFaint
  }

  const totalRounds = config?.roundGames.length ?? playoffs?.rounds.length ?? 0
  const currentRoundIdx = playoffs ? playoffs.rounds.length - 1 : -1
  const currentRoundName = currentRoundIdx >= 0 ? ROUND_NAMES[currentRoundIdx] ?? `Round ${currentRoundIdx + 1}` : ''

  const showPostseasonCard = seasonPhase !== 'regular' || !!playoffs

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Season Calendar" subtitle={`Season ${seasonNumber} · structural timeline, not a full fixture list`} />

      {sortedMonths.map((m) => (
        <div key={m.key} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
          <div
            style={{
              padding: '9px 16px',
              background: COLORS.bg,
              borderBottom: `1px solid ${COLORS.border}`
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
                color: COLORS.textPrimary
              }}
            >
              {m.label}
            </span>
          </div>

          {m.milestones.length > 0 ? (
            <div style={{ padding: '4px 0' }}>
              {m.milestones.map((ms, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    borderBottom: `1px solid ${COLORS.bg}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: ms.accent ? COLORS.accent : COLORS.textFaint,
                        flexShrink: 0
                      }}
                    />
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 13,
                        fontWeight: 700,
                        color: ms.accent ? COLORS.accent : COLORS.textPrimary
                      }}
                    >
                      {ms.label}
                    </span>
                  </div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>{ms.dateStr}</span>
                </div>
              ))}
            </div>
          ) : null}

          {m.games.length > 0 ? (
            <div style={{ padding: '8px 16px 10px' }}>
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
                {myTeam} games this month
              </div>
              {m.games.map((g, i) => {
                const isHome = g.home === myTeam
                const opp = isHome ? g.away : g.home
                return (
                  <div
                    key={`${g.day}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      borderBottom: `1px solid ${COLORS.bg}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 46, flexShrink: 0 }}>
                        {MONTHS[g.date.m - 1].toUpperCase()} {g.date.d}
                      </span>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: teamColor(opp) }} />
                      <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textPrimary }}>
                        {isHome ? 'vs' : '@'} {teamCity(opp)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      ))}

      {showPostseasonCard ? (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
          <div style={{ padding: '9px 16px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, letterSpacing: 2, color: COLORS.textPrimary }}>
              POSTSEASON &amp; OFFSEASON
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {seasonPhase === 'playoffs' && playoffs && !playoffs.champion ? (
              <div style={{ padding: '8px 16px', borderBottom: `1px solid ${COLORS.bg}` }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  Playoffs in progress
                </span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>
                  {currentRoundName}
                  {totalRounds ? ` (round ${currentRoundIdx + 1} of ${totalRounds})` : ''}
                </span>
              </div>
            ) : null}
            {playoffs?.champion ? (
              <div style={{ padding: '8px 16px', borderBottom: `1px solid ${COLORS.bg}` }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                  Champion: {teamCity(playoffs.champion)}
                </span>
              </div>
            ) : null}
            {seasonPhase === 'offseason' ? (
              <div style={{ padding: '8px 16px', borderBottom: `1px solid ${COLORS.bg}` }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  Offseason: Draft &amp; Free Agency
                </span>
              </div>
            ) : null}
            {seasonPhase === 'offseason' && draftPhase === 'complete' ? (
              <div style={{ padding: '8px 16px' }}>
                <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                  Ready to start Season {seasonNumber + 1}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
