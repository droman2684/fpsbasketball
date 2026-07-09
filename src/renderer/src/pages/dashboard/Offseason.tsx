import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

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

function StepCard({
  num,
  title,
  status,
  statusColor,
  children
}: {
  num: number
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
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: COLORS.sidebarDark,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 13,
            flexShrink: 0
          }}
        >
          {num}
        </div>
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

export default function Offseason(): React.JSX.Element {
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const seasonNumber = useGameStore((s) => s.seasonNumber)
  const draftPhase = useGameStore((s) => s.draftPhase)
  const goToPage = useGameStore((s) => s.goToPage)
  const startNextSeason = useGameStore((s) => s.startNextSeason)

  if (seasonPhase !== 'offseason') {
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

  return (
    <PageShell maxWidth={800}>
      <PageHeader title="Offseason" subtitle="Wrap up the draft and free agency, then kick off next season" />

      <StepCard
        num={1}
        title="Draft Lottery & Draft"
        status={draftStatusLabel(draftPhase)}
        statusColor={draftDone ? COLORS.winGreen : COLORS.textMuted}
      >
        <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Run the lottery, then make your picks in the Draft Room.
        </p>
        <button
          onClick={() => goToPage('draft')}
          className="cta-btn"
          style={{
            padding: '10px 22px',
            background: COLORS.accent,
            color: 'white',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Go to Draft Room →
        </button>
      </StepCard>

      <StepCard num={2} title="Free Agency" status="Open" statusColor={COLORS.textMuted}>
        <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Sign free agents and pick through the waiver wire to round out your roster.
        </p>
        <button
          onClick={() => goToPage('freeAgency')}
          style={{
            padding: '10px 22px',
            background: '#1E1E1B',
            color: 'white',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Go to Free Agency →
        </button>
      </StepCard>

      <StepCard
        num={3}
        title={btnLabel}
        status={draftDone ? 'Ready' : 'Blocked'}
        statusColor={draftDone ? COLORS.winGreen : COLORS.lossRed}
      >
        <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Ages your roster, promotes drafted rookies, resets records, and builds next season&apos;s calendar.
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
      </StepCard>
    </PageShell>
  )
}
