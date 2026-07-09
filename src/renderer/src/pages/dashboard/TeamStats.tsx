import type { CSSProperties } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { RosterPlayer } from '@shared/types'

const GRID = '28px 1fr 52px 52px 52px 60px 60px 60px 60px'

const headerCellStyle: CSSProperties = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

// A team's realistic scoring/rebounding/assist output comes from its actual
// rotation (the players who see real minutes), not a flat sum of the full
// 15-man roster (which would blow well past real NBA team totals). Top-8 by
// pts is a reasonable stand-in for "the players who actually play" since
// there's no simulated per-game minutes/box score to draw the rotation from.
const ROTATION_SIZE = 8

function rotationTotals(roster: RosterPlayer[]): { ppg: number; rpg: number; apg: number } {
  const rotation = [...roster].sort((a, b) => b.pts - a.pts).slice(0, ROTATION_SIZE)
  return {
    ppg: rotation.reduce((a, p) => a + p.pts, 0),
    rpg: rotation.reduce((a, p) => a + p.reb, 0),
    apg: rotation.reduce((a, p) => a + p.ast, 0)
  }
}

export default function TeamStats(): React.JSX.Element {
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const myTeam = useGameStore((s) => s.myTeam)
  const myRoster = useGameStore((s) => s.myRoster)
  const rosters = useGameStore((s) => s.rosters)

  const rawTotals = leagueTeams.map((t) => ({
    abbr: t.abbr,
    ...rotationTotals(t.abbr === myTeam ? myRoster : (rosters[t.abbr] ?? []))
  }))
  const leagueAvgPpg = rawTotals.length > 0 ? rawTotals.reduce((a, r) => a + r.ppg, 0) / rawTotals.length : 100

  const teamStats = leagueTeams
    .map((t) => {
      const rec = records[t.abbr] ?? { w: 0, l: 0, l10: '0-0' }
      const wp = rec.w / (rec.w + rec.l + 0.01)
      const totals = rawTotals.find((r) => r.abbr === t.abbr)!
      const ppg = totals.ppg.toFixed(1)
      const rpg = totals.rpg.toFixed(1)
      const apg = totals.apg.toFixed(1)
      // No simulated defensive box score to derive opponent points allowed
      // from, so OPPG is pinned to the league's real average scoring output
      // and nudged by win% — better teams (higher wp) concede a bit less
      // than league average, worse teams concede a bit more — keeping it
      // internally consistent with the new real PPG numbers rather than an
      // arbitrary hash-based formula.
      const oppg = (leagueAvgPpg + (0.5 - wp) * 14).toFixed(1)
      const pctNum = rec.w + rec.l > 0 ? rec.w / (rec.w + rec.l) : 0
      const mine = t.abbr === myTeam
      return {
        ...t,
        w: rec.w,
        l: rec.l,
        ppg,
        oppg,
        rpg,
        apg,
        pct: pctNum.toFixed(3).replace(/^0/, ''),
        nameColor: mine ? 'oklch(0.45 0.19 42)' : COLORS.textPrimary,
        rowBg: mine ? 'oklch(0.99 0.007 42)' : COLORS.surface,
        fw: mine ? 700 : 400
      }
    })
    .sort((a, b) => parseFloat(b.ppg) - parseFloat(a.ppg))
    .map((t, i) => ({ ...t, rank: i + 1 }))

  return (
    <PageShell maxWidth={1100}>
      <PageHeader title="Team Stats" />
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
          <span style={headerCellStyle}>TEAM</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>W</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>L</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>PCT</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>PPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>OPPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>RPG</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>APG</span>
        </div>
        {teamStats.map((t) => (
          <div
            key={t.abbr}
            className="hover-fade"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              padding: '8px 18px',
              borderBottom: `1px solid ${COLORS.bg}`,
              background: t.rowBg,
              gap: 4,
              alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>{t.rank}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.primary, flexShrink: 0 }} />
              <span style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: t.fw, color: t.nameColor }}>{t.city}</span>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, textAlign: 'center', color: t.nameColor }}>
              {t.w}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'center', color: COLORS.textMuted }}>{t.l}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'right', color: COLORS.textMuted }}>{t.pct}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'right', color: COLORS.textPrimary }}>{t.ppg}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'right', color: COLORS.textMuted }}>{t.oppg}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'right', color: COLORS.textMuted }}>{t.rpg}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, textAlign: 'right', color: COLORS.textMuted }}>{t.apg}</span>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
