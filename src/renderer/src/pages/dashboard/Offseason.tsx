import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { OffseasonSubPhase } from '@shared/types'

const STAGES: Array<{ key: OffseasonSubPhase; label: string }> = [
  { key: 'combine', label: 'Combine & Scouting' },
  { key: 'draft', label: 'Draft' },
  { key: 'moratorium', label: 'Moratorium' },
  { key: 'freeAgency', label: 'Free Agency' },
  { key: 'trainingCamp', label: 'Training Camp' }
]

function draftStatusLabel(phase: string): string {
  switch (phase) {
    case 'off':
      return 'Not started'
    case 'lottery':
      return 'Lottery ready'
    case 'lotteryReveal':
      return 'Lottery in progress'
    case 'board':
      return 'Draft in progress'
    case 'complete':
      return 'Complete'
    default:
      return phase
  }
}

function ActionCard({
  title,
  status,
  statusColor,
  children
}: {
  title: string
  status: string
  statusColor: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
      <div
        style={{
          padding: '12px 18px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <h2 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 17, letterSpacing: 1, flex: 1 }}>{title}</h2>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: statusColor,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 600
          }}
        >
          {status}
        </span>
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}

function actionButtonStyle(primary: boolean): React.CSSProperties {
  return {
    padding: '10px 22px',
    background: primary ? COLORS.accent : '#1E1E1B',
    color: 'white',
    border: 'none',
    fontFamily: FONTS.display,
    fontWeight: primary ? 900 : 800,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginRight: 8
  }
}

export default function Offseason(): React.JSX.Element {
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const seasonNumber = useGameStore((s) => s.seasonNumber)
  const draftPhase = useGameStore((s) => s.draftPhase)
  const offseasonDay = useGameStore((s) => s.offseasonDay)
  const offseasonPhase = useGameStore((s) => s.offseasonPhase)
  const offseasonCalendar = useGameStore((s) => s.offseasonCalendar)
  const goToPage = useGameStore((s) => s.goToPage)
  const startNextSeason = useGameStore((s) => s.startNextSeason)

  if (seasonPhase !== 'offseason' || !offseasonCalendar) {
    return (
      <PageShell maxWidth={800}>
        <PageHeader title="Offseason" />
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NOTHING TO DO HERE YET
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>Finish the season first.</p>
        </div>
      </PageShell>
    )
  }

  const draftDone = draftPhase === 'complete'
  const btnLabel = `START SEASON ${seasonNumber + 1}`
  const currentIdx = STAGES.findIndex((s) => s.key === offseasonPhase)
  const progressPct = Math.min(100, Math.round((offseasonDay / offseasonCalendar.seasonStartDay) * 100))

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Offseason" subtitle={`Day ${offseasonDay} of ${offseasonCalendar.seasonStartDay} — use SIM DAY/WEEK/MONTH to advance`} />

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          {STAGES.map((stage, i) => (
            <div key={stage.key} style={{ flex: 1, textAlign: i === 0 ? 'left' : i === STAGES.length - 1 ? 'right' : 'center' }}>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  fontWeight: i === currentIdx ? 700 : 500,
                  color: i === currentIdx ? COLORS.accent : i < currentIdx ? COLORS.textMuted : COLORS.textFaint
                }}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: COLORS.accent, transition: 'width 0.2s ease' }} />
        </div>
      </div>

      {offseasonPhase === 'combine' && (
        <ActionCard title="Combine & Scouting" status={draftStatusLabel(draftPhase)} statusColor={COLORS.textMuted}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Allocate scouting effort now — reports narrow as you sim forward. The combine runs automatically on day{' '}
            {offseasonCalendar.combineDay}.
          </p>
          <button onClick={() => goToPage('prospectScouting')} className="cta-btn" style={actionButtonStyle(true)}>
            Prospect Scouting →
          </button>
          <button onClick={() => goToPage('draftCombine')} style={actionButtonStyle(false)}>
            Draft Combine →
          </button>
        </ActionCard>
      )}

      {offseasonPhase === 'draft' && (
        <ActionCard
          title="Draft Lottery & Draft"
          status={draftStatusLabel(draftPhase)}
          statusColor={draftDone ? COLORS.winGreen : COLORS.textMuted}
        >
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Run the lottery, then make your picks in the Draft Room. The offseason calendar holds here until the draft is complete.
          </p>
          <button onClick={() => goToPage('draft')} className="cta-btn" style={actionButtonStyle(true)}>
            Go to Draft Room →
          </button>
        </ActionCard>
      )}

      {offseasonPhase === 'moratorium' && (
        <ActionCard title="Moratorium" status="Waiting" statusColor={COLORS.textMuted}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>
            Nothing to do yet — free agency opens on day {offseasonCalendar.faOpenDay}. Sim forward to get there.
          </p>
        </ActionCard>
      )}

      {offseasonPhase === 'freeAgency' && (
        <ActionCard title="Free Agency" status="Open" statusColor={COLORS.textMuted}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            Make offers and negotiate — rival teams are bidding on the same players. Sim forward each day to see responses.
          </p>
          <button onClick={() => goToPage('freeAgency')} className="cta-btn" style={actionButtonStyle(true)}>
            Go to Free Agency →
          </button>
        </ActionCard>
      )}

      {offseasonPhase === 'trainingCamp' && (
        <ActionCard title="Training Camp" status="In progress" statusColor={COLORS.textMuted}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>
            Remaining roster spots fill from what&apos;s left in the free-agent pool. Sim forward to tip-off on Oct 21.
          </p>
        </ActionCard>
      )}

      <ActionCard title={btnLabel} status={draftDone ? 'Ready' : 'Blocked'} statusColor={draftDone ? COLORS.winGreen : COLORS.lossRed}>
        <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Fast-forwards straight to tip-off: ages your roster, promotes drafted rookies, resets records, and builds next season&apos;s
          calendar.
        </p>
        <button
          onClick={() => draftDone && startNextSeason()}
          disabled={!draftDone}
          style={{
            padding: '12px 26px',
            background: draftDone ? COLORS.accent : '#D8D6D1',
            color: draftDone ? 'white' : '#9A9894',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: draftDone ? 'pointer' : 'not-allowed'
          }}
        >
          {btnLabel}
        </button>
        {!draftDone ? (
          <p style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textFaint, marginTop: 8 }}>Complete your draft first.</p>
        ) : null}
      </ActionCard>
    </PageShell>
  )
}
