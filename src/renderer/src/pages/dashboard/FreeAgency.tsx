import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { fmt$ } from '@renderer/data/engine'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

export default function FreeAgency(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const config = useGameStore((s) => s.config)
  const freeAgentPool = useGameStore((s) => s.freeAgentPool)
  const signFreeAgent = useGameStore((s) => s.signFreeAgent)
  const [blockedId, setBlockedId] = useState<number | null>(null)

  const capLimit = (config?.salaryCap ?? 136) * 1e6
  const totalSalary = myRoster.reduce((a, p) => a + p.salary, 0)
  const capSpace = Math.max(0, capLimit - totalSalary)
  const capSpaceM = (capSpace / 1e6).toFixed(1)

  const availableFreeAgents = freeAgentPool

  const handleOffer = (faId: number): void => {
    const ok = signFreeAgent(faId)
    if (!ok) {
      setBlockedId(faId)
    } else {
      setBlockedId(null)
    }
  }

  return (
    <PageShell maxWidth={1100}>
      <PageHeader
        title="Free Agency"
        subtitle={`${availableFreeAgents.length} players available · CAP SPACE: $${capSpaceM}M`}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
        {availableFreeAgents.map((p) => (
          <div
            key={p.id}
            className="hover-border"
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
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
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 11, color: ovrColor(p.ovr) }}>{p.ovr}</span>
              </div>
              <div>
                <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{p.name}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2 }}>
                  {p.pos} · Age {p.age} · {p.pts} PPG · {p.reb} RPG
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>
                  Asking: {fmt$(p.salary)}
                </div>
                {blockedId === p.id ? (
                  <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#B3261E', marginTop: 4 }}>
                    Blocked — would exceed salary cap
                  </div>
                ) : null}
              </div>
            </div>
            <button
              onClick={() => handleOffer(p.id)}
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
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Make Offer
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
