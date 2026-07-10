import type { CSSProperties } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor, fmtMoney, seg } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { RosterPlayer } from '@shared/types'

const GRID_COLS = '32px 48px 1fr 44px 52px 52px 52px 52px 52px 110px 44px 72px'

const SORT_BTNS: Array<{ key: string; label: string }> = [
  { key: 'ovr', label: 'OVR' },
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'sal', label: 'CONTRACT' }
]

function sortRoster(roster: RosterPlayer[], key: string): RosterPlayer[] {
  const list = [...roster]
  switch (key) {
    case 'pts':
      return list.sort((a, b) => b.pts - a.pts)
    case 'reb':
      return list.sort((a, b) => b.reb - a.reb)
    case 'ast':
      return list.sort((a, b) => b.ast - a.ast)
    case 'sal':
      return list.sort((a, b) => b.salary - a.salary)
    case 'ovr':
    default:
      return list.sort((a, b) => b.ovr - a.ovr)
  }
}

function statusColors(status: RosterPlayer['status']): { color: string; bg: string } {
  if (status === 'Active') return { color: 'oklch(0.45 0.18 140)', bg: 'oklch(0.94 0.04 140)' }
  if (status === 'GTD') return { color: COLORS.accent, bg: 'oklch(0.95 0.04 42)' }
  return { color: COLORS.lossRed, bg: 'oklch(0.95 0.04 15)' }
}

const headerCellStyle: CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

export default function Roster(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const myTeam = useGameStore((s) => s.myTeam)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const rosterSort = useGameStore((s) => s.rosterSort)
  const setRosterSort = useGameStore((s) => s.setRosterSort)

  const myTeamInfo = leagueTeams.find((t) => t.abbr === myTeam)
  const teamLabel = myTeamInfo ? `${myTeamInfo.city} ${myTeamInfo.name}` : myTeam
  const rosterSorted = sortRoster(myRoster, rosterSort)

  return (
    <PageShell maxWidth={1380}>
      <PageHeader title={`${teamLabel} Roster`} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9,
            color: COLORS.textFaint,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginRight: 4
          }}
        >
          Sort:
        </span>
        {SORT_BTNS.map((sb) => {
          const active = rosterSort === sb.key
          return (
            <button
              key={sb.key}
              onClick={() => setRosterSort(sb.key)}
              style={{
                padding: '5px 12px',
                background: seg.bg(active),
                color: seg.fg(active),
                border: `1px solid ${seg.border(active)}`,
                fontFamily: FONTS.display,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1,
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {sb.label}
            </button>
          )
        })}
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            padding: '7px 18px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 4
          }}
        >
          <span style={headerCellStyle}>#</span>
          <span style={{ ...headerCellStyle, letterSpacing: 1 }}>POS</span>
          <span style={{ ...headerCellStyle, letterSpacing: 1 }}>NAME</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>AGE</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>OVR</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>POT</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>PPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>RPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>APG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>CONTRACT</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>YRS</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>STATUS</span>
        </div>
        {rosterSorted.map((p) => {
          const sc = statusColors(p.status)
          return (
            <div
              key={p.id}
              className="hover-row"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                padding: '9px 18px',
                borderBottom: `1px solid ${COLORS.bg}`,
                gap: 4,
                alignItems: 'center'
              }}
            >
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>{p.id}</span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: COLORS.textMuted,
                  background: COLORS.bg,
                  padding: '2px 6px',
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                {p.pos}
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.age}</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: ovrColor(p.ovr) }}>{p.ovr}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 13, color: ovrColor(p.potential) }}>
                  {p.potential}
                </span>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'center' }}>{p.pts}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.reb}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.ast}</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'right' }}>
                {fmtMoney(p.salary)}
              </span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.yrs}</span>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    fontWeight: 600,
                    color: sc.color,
                    background: sc.bg,
                    padding: '2px 6px',
                    letterSpacing: 1
                  }}
                >
                  {p.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
