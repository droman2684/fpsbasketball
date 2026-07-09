import type { CSSProperties } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { buildStandings, type StandingRow } from '@renderer/data/engine'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

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
              padding: '7px 14px',
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

function ConferenceBox({ label, rows }: { label: string; rows: StandingRow[] }): React.JSX.Element {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.sidebarDark }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 16,
            color: 'white',
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: STANDINGS_GRID,
          padding: '6px 14px',
          background: COLORS.bg,
          borderBottom: `1px solid ${COLORS.border}`
        }}
      >
        <span />
        <span style={headerCellStyle}>TEAM</span>
        <span style={{ ...headerCellStyle, textAlign: 'center' }}>W</span>
        <span style={{ ...headerCellStyle, textAlign: 'center' }}>L</span>
        <span style={{ ...headerCellStyle, textAlign: 'right' }}>PCT</span>
        <span style={{ ...headerCellStyle, textAlign: 'right' }}>GB</span>
        <span style={{ ...headerCellStyle, textAlign: 'right' }}>L10</span>
      </div>
      <StandingsRows rows={rows} />
    </div>
  )
}

export default function Standings(): React.JSX.Element {
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const myTeam = useGameStore((s) => s.myTeam)
  const config = useGameStore((s) => s.config)

  const confIndexes = Array.from(new Set(leagueTeams.map((t) => t.confIndex))).sort((a, b) => a - b)
  const twoConf = confIndexes.length === 2
  const playoffSpots = config?.playoffTeamsPerConf ?? 8

  const confLabel = (idx: number): string =>
    config?.conferences[idx]?.name || (idx === 0 ? 'Conference A' : idx === 1 ? 'Conference B' : `Conference ${idx + 1}`)

  return (
    <PageShell maxWidth={1380}>
      <PageHeader title="Conference Standings" />
      {twoConf ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {confIndexes.map((idx) => (
            <ConferenceBox key={idx} label={`${confLabel(idx)} Conference`} rows={buildStandings(leagueTeams, records, idx, myTeam, playoffSpots)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {confIndexes.map((idx) => (
            <ConferenceBox key={idx} label={confLabel(idx)} rows={buildStandings(leagueTeams, records, idx, myTeam, playoffSpots)} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
