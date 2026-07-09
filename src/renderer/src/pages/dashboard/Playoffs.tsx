import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import type { PlayoffSeries } from '@shared/types'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const ROUND_NAMES = ['Round 1', 'Round 2', 'Conference Finals', 'Finals']

export default function Playoffs(): React.JSX.Element {
  const playoffs = useGameStore((s) => s.playoffs)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const config = useGameStore((s) => s.config)
  const myTeam = useGameStore((s) => s.myTeam)

  function teamInfo(abbr: string): { label: string; color: string } {
    const t = leagueTeams.find((x) => x.abbr === abbr)
    return { label: t ? `${t.city} ${t.name}` : abbr, color: t?.primary ?? COLORS.textFaint }
  }
  function confLabel(idx: number | null): string {
    if (idx === null) return ''
    return config?.conferences[idx]?.name || (idx === 0 ? 'Conference A' : idx === 1 ? 'Conference B' : `Conference ${idx + 1}`)
  }

  function SeriesRow({ series }: { series: PlayoffSeries }): React.JSX.Element {
    const a = teamInfo(series.teamA)
    const b = teamInfo(series.teamB)
    const aWon = series.winner === series.teamA
    const bWon = series.winner === series.teamB
    const aIsMe = series.teamA === myTeam
    const bIsMe = series.teamB === myTeam
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '9px 14px',
          borderBottom: `1px solid ${COLORS.bg}`,
          gap: 10
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, flexShrink: 0 }}>{series.seedA}</span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: aWon ? 700 : aIsMe ? 700 : 400,
              color: aWon ? COLORS.textPrimary : COLORS.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {a.label}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            fontWeight: 700,
            color: series.winner ? COLORS.textPrimary : COLORS.textMuted,
            flexShrink: 0,
            width: 44,
            textAlign: 'center'
          }}
        >
          {series.winsA}-{series.winsB}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end', minWidth: 0 }}>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: 12,
              fontWeight: bWon ? 700 : bIsMe ? 700 : 400,
              color: bWon ? COLORS.textPrimary : COLORS.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right'
            }}
          >
            {b.label}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, flexShrink: 0 }}>{series.seedB}</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
        </div>
      </div>
    )
  }

  function FinalsBanner({ series }: { series: PlayoffSeries }): React.JSX.Element {
    const a = teamInfo(series.teamA)
    const b = teamInfo(series.teamB)
    const aWon = series.winner === series.teamA
    const bWon = series.winner === series.teamB
    return (
      <div style={{ background: COLORS.sidebarDark, padding: '20px 28px', marginBottom: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#5A5A56', letterSpacing: 4, textTransform: 'uppercase' }}>
            The Finals
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 22,
                color: aWon ? COLORS.accent : 'white',
                textAlign: 'right'
              }}
            >
              {a.label}
            </span>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 32,
              color: 'white',
              flexShrink: 0
            }}
          >
            {series.winsA}–{series.winsB}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 22,
                color: bWon ? COLORS.accent : 'white'
              }}
            >
              {b.label}
            </span>
          </div>
        </div>
      </div>
    )
  }

  function RoundColumn({ round, roundIdx }: { round: PlayoffSeries[]; roundIdx: number }): React.JSX.Element {
    return (
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, marginBottom: 12 }}>
        <div style={{ padding: '8px 14px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
            {ROUND_NAMES[roundIdx] ?? `Round ${roundIdx + 1}`}
          </span>
        </div>
        {round.map((s) => (
          <SeriesRow key={s.id} series={s} />
        ))}
      </div>
    )
  }

  if (!playoffs) {
    return (
      <PageShell maxWidth={1100}>
        <PageHeader title="Playoffs" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NO BRACKET YET
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>
            Playoffs begin once the regular season ends.
          </p>
        </div>
      </PageShell>
    )
  }

  const confIndexes = Array.from(
    new Set(playoffs.rounds.flatMap((r) => r.map((s) => s.confIndex)).filter((c): c is number => c !== null))
  ).sort((a, b) => a - b)
  const twoConf = confIndexes.length > 1

  // The Finals (confIndex null, appearing only once two conf champs remain)
  // gets its own full-width banner rather than sitting in the column grid.
  const finalsSeries = playoffs.rounds.flatMap((r) => r).find((s) => s.confIndex === null && twoConf) ?? null
  const confRounds = playoffs.rounds
    .map((round) => round.filter((s) => !(twoConf && s.confIndex === null)))
    .filter((round) => round.length > 0)

  return (
    <PageShell maxWidth={1100}>
      <PageHeader title="Playoffs" />

      {playoffs.champion ? (
        <div
          style={{
            background: COLORS.sidebarDark,
            padding: '28px',
            marginBottom: 20,
            textAlign: 'center'
          }}
        >
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: '#5A5A56', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>
            League Champion
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: teamInfo(playoffs.champion).color, flexShrink: 0 }} />
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 36, color: COLORS.accent }}>
              {teamInfo(playoffs.champion).label}
            </span>
          </div>
        </div>
      ) : null}

      {finalsSeries ? <FinalsBanner series={finalsSeries} /> : null}

      {twoConf ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[0, 1].map((confIdx) => (
            <div key={confIdx}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                {confLabel(confIdx)}
              </div>
              {confRounds.map((round, ri) => {
                const filtered = round.filter((s) => s.confIndex === confIdx)
                if (filtered.length === 0) return null
                return <RoundColumn key={ri} round={filtered} roundIdx={ri} />
              })}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {confRounds.map((round, ri) => (
            <RoundColumn key={ri} round={round} roundIdx={ri} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
