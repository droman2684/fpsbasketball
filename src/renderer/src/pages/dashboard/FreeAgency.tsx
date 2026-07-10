import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { fmt$ } from '@renderer/data/engine'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { FreeAgentNegotiation, RosterPlayer } from '@shared/types'

const RESPONSE_COLOR: Record<string, string> = {
  pending: COLORS.textMuted,
  countered: COLORS.accent,
  accepted: 'oklch(0.45 0.18 140)',
  rejected: COLORS.lossRed,
  signedElsewhere: COLORS.lossRed
}

function FreeAgentRow({
  player,
  negotiation,
  onOffer,
  onAcceptCounter,
  onWithdraw
}: {
  player: RosterPlayer
  negotiation?: FreeAgentNegotiation
  onOffer: (playerId: number, years: number, annualSalary: number) => boolean
  onAcceptCounter: (playerId: number) => void
  onWithdraw: (playerId: number) => void
}): React.JSX.Element {
  const [years, setYears] = useState(negotiation?.myOffer?.years ?? 2)
  const [salaryM, setSalaryM] = useState(Math.round(player.salary / 1e5) / 10)
  const [blocked, setBlocked] = useState(false)

  const bestRival = negotiation?.rivalOffers.slice().sort((a, b) => b.annualSalary - a.annualSalary)[0]

  const handleOffer = (): void => {
    const ok = onOffer(player.id, years, Math.round(salaryM * 1e6))
    setBlocked(!ok)
  }

  return (
    <div
      className="hover-border"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: COLORS.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1px solid ${COLORS.border}`
            }}
          >
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 11, color: ovrColor(player.ovr) }}>{player.ovr}</span>
          </div>
          <div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{player.name}</div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2 }}>
              {player.pos} · Age {player.age} · {player.pts} PPG · {player.reb} RPG
            </div>
          </div>
        </div>
        {negotiation && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: RESPONSE_COLOR[negotiation.agentResponse] ?? COLORS.textMuted
            }}
          >
            {negotiation.agentResponse}
          </span>
        )}
      </div>

      {negotiation?.agentMessage && (
        <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.4 }}>{negotiation.agentMessage}</div>
      )}

      {negotiation?.myOffer && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>
          Your offer: {negotiation.myOffer.years}yr / {fmt$(negotiation.myOffer.annualSalary)} per year
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint, letterSpacing: 1, textTransform: 'uppercase' }}>
            Years
          </span>
          <input
            type="number"
            min={1}
            max={5}
            value={years}
            onChange={(e) => setYears(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
            style={{ width: 50, padding: '5px 6px', border: `1px solid ${COLORS.border}`, fontFamily: FONTS.mono, fontSize: 12 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint, letterSpacing: 1, textTransform: 'uppercase' }}>
            $M / yr
          </span>
          <input
            type="number"
            min={0.5}
            step={0.1}
            value={salaryM}
            onChange={(e) => setSalaryM(Math.max(0.5, Number(e.target.value) || 0.5))}
            style={{ width: 70, padding: '5px 6px', border: `1px solid ${COLORS.border}`, fontFamily: FONTS.mono, fontSize: 12 }}
          />
        </label>
        <button
          onClick={handleOffer}
          className="hover-accent-fill"
          style={{
            padding: '7px 14px',
            background: COLORS.surface,
            color: COLORS.accent,
            border: `1.5px solid ${COLORS.accent}`,
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 1,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          {negotiation?.myOffer ? 'Revise Offer' : 'Make Offer'}
        </button>
        {bestRival && (
          <button
            onClick={() => onAcceptCounter(player.id)}
            className="hover-dim"
            style={{
              padding: '7px 14px',
              background: COLORS.accent,
              color: 'white',
              border: 'none',
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Match &amp; Beat
          </button>
        )}
        {negotiation?.myOffer && (
          <button
            onClick={() => onWithdraw(player.id)}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              color: COLORS.textFaint,
              border: `1px solid ${COLORS.border}`,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 11,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Withdraw
          </button>
        )}
      </div>
      {blocked && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#B3261E' }}>Blocked — would exceed salary cap</div>
      )}
    </div>
  )
}

export default function FreeAgency(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const config = useGameStore((s) => s.config)
  const freeAgentPool = useGameStore((s) => s.freeAgentPool)
  const freeAgentNegotiations = useGameStore((s) => s.freeAgentNegotiations)
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const offseasonPhase = useGameStore((s) => s.offseasonPhase)
  const makeFreeAgentOffer = useGameStore((s) => s.makeFreeAgentOffer)
  const acceptCounterOffer = useGameStore((s) => s.acceptCounterOffer)
  const withdrawFreeAgentOffer = useGameStore((s) => s.withdrawFreeAgentOffer)

  const capLimit = (config?.salaryCap ?? 136) * 1e6
  const totalSalary = myRoster.reduce((a, p) => a + p.salary, 0)
  const capSpace = Math.max(0, capLimit - totalSalary)
  const capSpaceM = (capSpace / 1e6).toFixed(1)

  const negotiationOpen = seasonPhase === 'offseason' && offseasonPhase === 'freeAgency'

  return (
    <PageShell maxWidth={1100}>
      <PageHeader
        title="Free Agency"
        subtitle={`${freeAgentPool.length} players available · CAP SPACE: $${capSpaceM}M`}
      />
      {!negotiationOpen && (
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: COLORS.textMuted,
            marginBottom: 14,
            letterSpacing: 0.5
          }}
        >
          The negotiation window opens once the offseason reaches free agency — offers made now won&apos;t be picked up until then.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 10 }}>
        {freeAgentPool.map((p) => (
          <FreeAgentRow
            key={p.id}
            player={p}
            negotiation={freeAgentNegotiations[p.id]}
            onOffer={makeFreeAgentOffer}
            onAcceptCounter={acceptCounterOffer}
            onWithdraw={withdrawFreeAgentOffer}
          />
        ))}
      </div>
    </PageShell>
  )
}
