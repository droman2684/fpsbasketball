import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

interface RuleRow {
  label: string
  desc: string
  value: string
}

// Describes a rounds-array entry ("best of N") for the playoff format /
// championship rows — the source derives these from the last two roundGames
// entries (first round vs. finals).
function bestOf(games: number | undefined): string {
  if (!games) return 'Best of 7'
  return `Best of ${games}`
}

export default function LeagueRules(): React.JSX.Element {
  const config = useGameStore((s) => s.config)
  const leagueTeams = useGameStore((s) => s.leagueTeams)

  const divisions = config?.conferences.reduce((a, c) => a + c.divisions.length, 0) ?? 0
  const roundGames = config?.roundGames ?? []
  const firstRound = roundGames[0]
  const finals = roundGames[roundGames.length - 1]

  const leagueRuleItems: RuleRow[] = [
    { label: 'League Name', desc: 'LEAGUE IDENTIFIER', value: config?.leagueName ?? '—' },
    { label: 'Number of Teams', desc: 'ACTIVE FRANCHISES', value: String(leagueTeams.length) },
    { label: 'Games per Season', desc: 'REGULAR SEASON', value: `${config?.gamesPerSeason ?? 0} games` },
    { label: 'Conferences', desc: 'EAST + WEST', value: `${config?.conferences.length ?? 0} Conferences` },
    { label: 'Divisions', desc: `${config?.conferences.length ?? 0} PER CONFERENCE`, value: `${divisions} Divisions` },
    { label: 'Playoff Teams', desc: 'PER CONFERENCE', value: `${config?.playoffTeamsPerConf ?? 0} teams` },
    { label: 'Playoff Format', desc: 'ROUNDS 1-3', value: bestOf(firstRound) },
    { label: 'Championship', desc: 'NBA FINALS FORMAT', value: bestOf(finals) }
  ]

  return (
    <PageShell maxWidth={800}>
      <PageHeader title="League Rules" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        {leagueRuleItems.map((r) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: `1px solid ${COLORS.bg}`
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{r.label}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2, letterSpacing: 1 }}>
                {r.desc}
              </div>
            </div>
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 16,
                color: COLORS.textPrimary,
                letterSpacing: 0.5,
                flexShrink: 0,
                marginLeft: 20
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
