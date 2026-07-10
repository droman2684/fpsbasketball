import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

function potColor(grade: string): string {
  if (grade.startsWith('A')) return 'oklch(0.45 0.18 140)'
  if (grade.startsWith('B')) return COLORS.ovrB
  return COLORS.textMuted
}

export default function ProspectScouting(): React.JSX.Element {
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const offseasonCalendar = useGameStore((s) => s.offseasonCalendar)
  const draftProspects = useGameStore((s) => s.draftProspects)
  const scoutingAllocations = useGameStore((s) => s.scoutingAllocations)
  const setScoutingAllocation = useGameStore((s) => s.setScoutingAllocation)
  const [sortAsc, setSortAsc] = useState(true)

  if (seasonPhase !== 'offseason' || !offseasonCalendar) {
    return (
      <PageShell maxWidth={900}>
        <PageHeader title="Prospect Scouting" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NOTHING TO DO HERE YET
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>Scouting opens once the offseason begins.</p>
        </div>
      </PageShell>
    )
  }

  const prospects = (draftProspects ?? [])
    .filter((p) => !p.drafted)
    .slice()
    .sort((a, b) => (sortAsc ? a.rank - b.rank : b.rank - a.rank))

  return (
    <PageShell maxWidth={1100}>
      <PageHeader
        title="Prospect Scouting"
        subtitle="Assign daily scouting points per prospect — reports narrow as SIM DAY/WEEK/MONTH advances the offseason"
      />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 44px 90px 100px 1fr 140px',
            padding: '8px 16px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            fontFamily: FONTS.mono,
            fontSize: 8,
            color: COLORS.textFaint,
            gap: 8
          }}
        >
          <span onClick={() => setSortAsc((v) => !v)} style={{ cursor: 'pointer' }}>
            RK
          </span>
          <span>PROSPECT</span>
          <span style={{ textAlign: 'center' }}>POS</span>
          <span style={{ textAlign: 'center' }}>SCOUTED OVR</span>
          <span style={{ textAlign: 'center' }}>SCOUTED POT</span>
          <span>PROGRESS</span>
          <span style={{ textAlign: 'right' }}>DAILY POINTS</span>
        </div>
        {prospects.map((p) => {
          const points = scoutingAllocations[p.id] ?? 0
          return (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 44px 90px 100px 1fr 140px',
                padding: '9px 16px',
                borderBottom: `1px solid ${COLORS.bg}`,
                gap: 8,
                alignItems: 'center'
              }}
            >
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>{p.rank}</span>
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
                  {p.origin} · Age {p.age}
                  {p.combineRevealed ? ` · ${p.measurables?.drillGrade} drill` : ''}
                </div>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: 14,
                  color: ovrColor(Math.round((p.scoutedOvrRange.lo + p.scoutedOvrRange.hi) / 2)),
                  textAlign: 'center'
                }}
              >
                {p.scoutedOvrRange.lo}-{p.scoutedOvrRange.hi}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  fontWeight: 600,
                  color: potColor(p.scoutedPotentialRange[1]),
                  textAlign: 'center'
                }}
              >
                {p.scoutedPotentialRange[0]} to {p.scoutedPotentialRange[1]}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(p.scoutingProgress)}%`,
                      background: COLORS.accent
                    }}
                  />
                </div>
                <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 30, flexShrink: 0 }}>
                  {Math.round(p.scoutingProgress)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setScoutingAllocation(p.id, Math.max(0, points - 1))}
                  className="hover-simbtn"
                  style={{
                    width: 22,
                    height: 22,
                    background: '#1E1E1B',
                    color: '#AEACA8',
                    border: '1px solid #2A2A26',
                    cursor: 'pointer',
                    fontFamily: FONTS.mono,
                    fontSize: 12
                  }}
                >
                  −
                </button>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textPrimary, width: 18, textAlign: 'center' }}>
                  {points}
                </span>
                <button
                  onClick={() => setScoutingAllocation(p.id, Math.min(10, points + 1))}
                  className="hover-simbtn"
                  style={{
                    width: 22,
                    height: 22,
                    background: '#1E1E1B',
                    color: '#AEACA8',
                    border: '1px solid #2A2A26',
                    cursor: 'pointer',
                    fontFamily: FONTS.mono,
                    fontSize: 12
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
