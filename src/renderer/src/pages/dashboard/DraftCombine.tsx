import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

export default function DraftCombine(): React.JSX.Element {
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const offseasonCalendar = useGameStore((s) => s.offseasonCalendar)
  const offseasonDay = useGameStore((s) => s.offseasonDay)
  const draftProspects = useGameStore((s) => s.draftProspects)

  if (seasonPhase !== 'offseason' || !offseasonCalendar) {
    return (
      <PageShell maxWidth={800}>
        <PageHeader title="Draft Combine" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NOTHING TO DO HERE YET
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>The combine only runs during the offseason.</p>
        </div>
      </PageShell>
    )
  }

  const prospects = draftProspects ?? []
  const revealed = prospects.filter((p) => p.combineRevealed)
  const daysUntil = offseasonCalendar.combineDay - offseasonDay

  if (revealed.length === 0) {
    return (
      <PageShell maxWidth={800}>
        <PageHeader title="Draft Combine" subtitle="Measurables and drill grades for this year's draft class" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            COMBINE NOT YET RUN
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>
            {daysUntil > 0 ? `Sim forward ${daysUntil} more day${daysUntil === 1 ? '' : 's'} to reach the combine.` : 'Sim forward to reach the combine.'}
          </p>
        </div>
      </PageShell>
    )
  }

  const rows = revealed
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({
      ...p,
      ovrColorVal: ovrColor(Math.round((p.scoutedOvrRange.lo + p.scoutedOvrRange.hi) / 2))
    }))

  return (
    <PageShell maxWidth={1100}>
      <PageHeader title="Draft Combine" subtitle={`${revealed.length} prospects measured`} />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 44px 70px 70px 70px 70px 60px',
            padding: '8px 16px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            fontFamily: FONTS.mono,
            fontSize: 8,
            color: COLORS.textFaint,
            gap: 4
          }}
        >
          <span>RK</span>
          <span>PROSPECT</span>
          <span style={{ textAlign: 'center' }}>POS</span>
          <span style={{ textAlign: 'center' }}>HGT</span>
          <span style={{ textAlign: 'center' }}>WING</span>
          <span style={{ textAlign: 'center' }}>VERT</span>
          <span style={{ textAlign: 'center' }}>SPRINT</span>
          <span style={{ textAlign: 'center' }}>DRILL</span>
        </div>
        {rows.map((p) => (
          <div
            key={p.id}
            className="hover-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 44px 70px 70px 70px 70px 60px',
              padding: '9px 16px',
              borderBottom: `1px solid ${COLORS.bg}`,
              gap: 4,
              alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>{p.rank}</span>
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
                Scouted OVR {p.scoutedOvrRange.lo}-{p.scoutedOvrRange.hi}
              </div>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'center' }}>
              {Math.floor((p.measurables?.heightIn ?? 0) / 12)}&apos;{(p.measurables?.heightIn ?? 0) % 12}&quot;
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'center' }}>
              {Math.floor((p.measurables?.wingspanIn ?? 0) / 12)}&apos;{(p.measurables?.wingspanIn ?? 0) % 12}&quot;
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'center' }}>
              {p.measurables?.verticalIn}&quot;
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'center' }}>
              {p.measurables?.sprintSec}s
            </span>
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 13, color: p.ovrColorVal, textAlign: 'center' }}>
              {p.measurables?.drillGrade}
            </span>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
