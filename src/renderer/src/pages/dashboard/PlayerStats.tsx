import type { CSSProperties } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { buildLeagueLeaderboard } from '@renderer/data/leaders'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import SegmentedControl from '@renderer/components/dashboard/SegmentedControl'

type StatKey = 'pts' | 'reb' | 'ast' | 'stl' | 'blk'

const STAT_CAT_OPTIONS: Array<{ key: StatKey; label: string }> = [
  { key: 'pts', label: 'PTS' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' }
]

const STAT_CAT_LABEL: Record<StatKey, string> = { pts: 'PPG', reb: 'RPG', ast: 'APG', stl: 'SPG', blk: 'BPG' }

const GRID = '40px 1fr 60px 52px 72px 72px 72px 72px'

const headerCellStyle: CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

export default function PlayerStats(): React.JSX.Element {
  const myTeam = useGameStore((s) => s.myTeam)
  const myRoster = useGameStore((s) => s.myRoster)
  const rosters = useGameStore((s) => s.rosters)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const statCat = useGameStore((s) => s.statCat)
  const setStatCat = useGameStore((s) => s.setStatCat)

  const cat: StatKey = (STAT_CAT_OPTIONS.some((o) => o.key === statCat) ? statCat : 'pts') as StatKey

  const leaguePlayers = buildLeagueLeaderboard(myTeam, myRoster, rosters, leagueTeams)

  const statLeaders = [...leaguePlayers]
    .sort((a, b) => b[cat] - a[cat])
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      mainStat: p[cat].toFixed(1),
      mainColor: i < 3 ? COLORS.accent : COLORS.textPrimary,
      rankColor: i < 3 ? COLORS.accent : COLORS.textFaint,
      rowBg: p.team === myTeam ? 'oklch(0.99 0.007 42)' : COLORS.surface
    }))

  return (
    <PageShell maxWidth={1200}>
      <PageHeader title="Player Stats" />
      <div style={{ marginBottom: 14 }}>
        <SegmentedControl options={STAT_CAT_OPTIONS} value={cat} onChange={setStatCat} />
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '7px 18px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 4
          }}
        >
          <span style={headerCellStyle}>#</span>
          <span style={headerCellStyle}>PLAYER</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>TEAM</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>POS</span>
          <span style={{ ...headerCellStyle, color: COLORS.accent, textAlign: 'right', letterSpacing: 1 }}>
            {STAT_CAT_LABEL[cat]}
          </span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>PPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>RPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>APG</span>
        </div>
        {statLeaders.map((p) => (
          <div
            key={`${p.team}-${p.name}`}
            className="hover-fade"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              padding: '9px 18px',
              borderBottom: `1px solid ${COLORS.bg}`,
              background: p.rowBg,
              gap: 4,
              alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: p.rankColor, fontWeight: 600 }}>{p.rank}</span>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.teamPrimary }} />
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textMuted }}>{p.team}</span>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600, color: p.mainColor, textAlign: 'right' }}>
              {p.mainStat}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>
              {p.pts.toFixed(1)}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>
              {p.reb.toFixed(1)}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>
              {p.ast.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
