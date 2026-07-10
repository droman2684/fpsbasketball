import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

export default function TradeOffers(): React.JSX.Element {
  const pendingOffers = useGameStore((s) => s.pendingOffers)
  const progressionLog = useGameStore((s) => s.progressionLog)
  const acceptOffer = useGameStore((s) => s.acceptOffer)
  const declineOffer = useGameStore((s) => s.declineOffer)

  return (
    <PageShell maxWidth={900}>
      <PageHeader
        title="Trade Offers"
        subtitle="Proposals received from other teams · simulate more games to receive offers"
      />
      {pendingOffers.length === 0 ? (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.textFaint, fontWeight: 700, marginBottom: 6 }}>
            NO PENDING OFFERS
          </div>
          <p style={{ fontSize: 13, color: '#C0BEB9' }}>CPU teams will propose trades as the season progresses.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {pendingOffers.map((offer) => (
            <div key={offer.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: `1px solid ${COLORS.border}`,
                  background: COLORS.bg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: offer.fromColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 9, color: 'white' }}>{offer.fromTeam}</span>
                </div>
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: COLORS.textPrimary, letterSpacing: 0.5 }}>
                  {offer.fromName}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.accent,
                    letterSpacing: 2,
                    textTransform: 'uppercase'
                  }}
                >
                  Trade Proposal
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 0 }}>
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.textFaint,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 10
                    }}
                  >
                    You Send
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>
                    {offer.wantName}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>
                    {offer.wantPos} · OVR {offer.wantOvr}
                  </div>
                  {offer.wantPickLabel ? (
                    <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.accent, fontWeight: 700, marginTop: 4 }}>
                      + {offer.wantPickLabel}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: COLORS.bg,
                    borderLeft: `1px solid ${COLORS.border}`,
                    borderRight: `1px solid ${COLORS.border}`
                  }}
                >
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: COLORS.textFaint }}>⇄</span>
                </div>
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.textFaint,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      marginBottom: 10
                    }}
                  >
                    You Receive
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>
                    {offer.offerName}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>
                    {offer.offerPos} · OVR {offer.offerOvr}
                  </div>
                  {offer.offerPickLabel ? (
                    <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.accent, fontWeight: 700, marginTop: 4 }}>
                      + {offer.offerPickLabel}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                style={{
                  padding: '12px 18px',
                  borderTop: `1px solid ${COLORS.border}`,
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={() => declineOffer(offer.id)}
                  className="hover-bg-tint"
                  style={{
                    padding: '8px 22px',
                    background: COLORS.surface,
                    color: COLORS.textMuted,
                    border: `1.5px solid ${COLORS.border}`,
                    fontFamily: FONTS.display,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: 1.5,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  DECLINE
                </button>
                <button
                  onClick={() => acceptOffer(offer.id)}
                  className="hover-dim"
                  style={{
                    padding: '8px 22px',
                    background: COLORS.accent,
                    color: 'white',
                    border: 'none',
                    fontFamily: FONTS.display,
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: 1.5,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  ACCEPT TRADE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {progressionLog.length > 0 ? (
        <div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textFaint,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Player Development Log
          </div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            {progressionLog.map((entry, i) => (
              <div
                key={`${entry.name}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 18px',
                  borderBottom: `1px solid ${COLORS.bg}`
                }}
              >
                <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{entry.name}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: entry.color }}>{entry.change}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
