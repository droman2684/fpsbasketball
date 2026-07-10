import { useMemo } from 'react'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'

interface Bullet {
  title: string
  desc: string
}

interface KeyPlayer {
  name: string
  pos: string
  ovr: number
  statsLine: string
}

// The source .dc.html hardcodes one team's (Miami's) scouting blurb. Since the
// opponent here is any of the 30 league teams, we derive plausible bullets
// procedurally from the generated roster's win% and average OVR instead —
// picking condition-matched bullets first and padding with generic flavor
// text so every team always shows exactly 3 strengths + 3 weaknesses.
function buildBullets(
  candidates: Array<{ cond: boolean; title: string; desc: string }>,
  fallbacks: Bullet[]
): Bullet[] {
  const picked = candidates.filter((c) => c.cond).map((c) => ({ title: c.title, desc: c.desc }))
  for (const fb of fallbacks) {
    if (picked.length >= 3) break
    if (!picked.some((p) => p.title === fb.title)) picked.push(fb)
  }
  return picked.slice(0, 3)
}

export default function Scouting(): React.JSX.Element {
  const scoutTeam = useGameStore((s) => s.scoutTeam)
  const setScoutTeam = useGameStore((s) => s.setScoutTeam)
  const myTeam = useGameStore((s) => s.myTeam)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const rosters = useGameStore((s) => s.rosters)

  const teamOptions = leagueTeams
    .filter((t) => t.abbr !== myTeam)
    .map((t) => ({ abbr: t.abbr, label: `${t.city} ${t.name}` }))

  const report = useMemo(() => {
    if (!scoutTeam) return null
    const roster = rosters[scoutTeam] ?? []
    if (roster.length === 0) return null
    const rec = records[scoutTeam] ?? { w: 5, l: 10, l10: '0-0' }
    const wp = rec.w / (rec.w + rec.l + 0.01)
    const avgOvr = roster.reduce((sum, p) => sum + p.ovr, 0) / roster.length
    const sorted = [...roster].sort((a, b) => b.ovr - a.ovr)
    const top = sorted[0]
    const bottom = sorted[sorted.length - 1]

    const strengths = buildBullets(
      [
        {
          cond: wp >= 0.55,
          title: 'Strong Team Record',
          desc: `${rec.w}-${rec.l} mark ranks among the better records in the league`
        },
        { cond: avgOvr >= 78, title: 'Interior Scoring', desc: 'Deep frontcourt talent creates easy looks around the rim' },
        {
          cond: !!top && top.ovr >= 85,
          title: 'Franchise Cornerstone',
          desc: `${top?.name} anchors the roster as an elite two-way threat`
        },
        { cond: wp >= 0.5, title: 'Battle-Tested Rotation', desc: 'Consistently competitive in close games down the stretch' }
      ],
      [
        { title: 'Balanced Attack', desc: 'Shares the ball well and gets contributions across the roster' },
        { title: 'Home Court Advantage', desc: 'Plays with confidence in front of their crowd' },
        { title: 'Veteran Poise', desc: 'Rarely beats itself in high-leverage moments' }
      ]
    )

    const weaknesses = buildBullets(
      [
        {
          cond: wp < 0.4,
          title: 'Inconsistent Record',
          desc: `${rec.w}-${rec.l} mark reflects real struggles on both ends`
        },
        { cond: avgOvr < 75, title: 'Limited Depth', desc: 'Talent drops off quickly outside the top rotation pieces' },
        { cond: wp < 0.45, title: 'Late-Game Execution', desc: 'Has struggled to close out close contests this season' },
        {
          cond: !!bottom && bottom.ovr < 68,
          title: 'Bench Production',
          desc: 'Reserves provide minimal scoring punch'
        }
      ],
      [
        { title: 'Perimeter Defense', desc: 'Opponents have found success attacking off the dribble' },
        { title: 'Rebounding Margin', desc: 'Gets out-rebounded on a fairly regular basis' },
        { title: 'Three-Point Shooting', desc: 'Shot selection from deep has been inefficient' }
      ]
    )

    const keyPlayers: KeyPlayer[] = sorted.slice(0, 3).map((p) => {
      const ppg = ((p.ovr - 60) * 0.28 + 8).toFixed(1)
      const isGuard = p.pos === 'PG' || p.pos === 'SG'
      const secondary = isGuard
        ? `${(p.pos === 'PG' ? 6.2 : 3.4).toFixed(1)} APG`
        : `${(p.pos === 'C' ? 9.6 : p.pos === 'PF' ? 7.8 : 4.6).toFixed(1)} RPG`
      return { name: p.name, pos: p.pos, ovr: p.ovr, statsLine: `${ppg} PPG · ${secondary}` }
    })

    return { strengths, weaknesses, keyPlayers }
  }, [scoutTeam, records, rosters])

  const cardStyle = { background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 20 }

  return (
    <PageShell maxWidth={1000}>
      <PageHeader title="Scouting Report" />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          padding: '14px 18px'
        }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textFaint,
            letterSpacing: 2,
            textTransform: 'uppercase',
            flexShrink: 0
          }}
        >
          Next Opponent:
        </span>
        <select
          value={scoutTeam}
          onChange={(e) => setScoutTeam(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `1.5px solid ${COLORS.border}`,
            background: COLORS.bg,
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.textPrimary,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {teamOptions.map((opt) => (
            <option key={opt.abbr} value={opt.abbr}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {report ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={cardStyle}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.accent,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginBottom: 12
                }}
              >
                Strengths
              </div>
              {report.strengths.map((s) => (
                <div
                  key={s.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: `1px solid ${COLORS.bg}`
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: COLORS.accent,
                      marginTop: 4,
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      {s.title}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textMuted,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  marginBottom: 12
                }}
              >
                Weaknesses
              </div>
              {report.weaknesses.map((w) => (
                <div
                  key={w.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: `1px solid ${COLORS.bg}`
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#B0AEA9',
                      marginTop: 4,
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                      {w.title}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>
                      {w.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                color: COLORS.textFaint,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 12
              }}
            >
              Key Players
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {report.keyPlayers.map((p) => (
                <div key={p.name} style={{ background: COLORS.bg, padding: 14 }}>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      marginBottom: 2
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginBottom: 6 }}>
                    {p.pos} · OVR {p.ovr}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>{p.statsLine}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
