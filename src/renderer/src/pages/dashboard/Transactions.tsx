import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { TransactionType } from '@shared/types'

const TX_STYLE: Record<TransactionType, { color: string; bg: string }> = {
  TRADE: { color: '#1D428A', bg: 'oklch(0.94 0.03 240)' },
  SIGN: { color: 'oklch(0.45 0.18 140)', bg: 'oklch(0.94 0.04 140)' },
  WAIVE: { color: COLORS.textMuted, bg: COLORS.bg },
  DRAFT: { color: 'oklch(0.45 0.18 140)', bg: 'oklch(0.94 0.04 140)' },
  EXPANSION: { color: '#1D428A', bg: 'oklch(0.94 0.03 240)' }
}

export default function Transactions(): React.JSX.Element {
  const transactions = useGameStore((s) => s.transactions)

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Transactions" />
      {transactions.length === 0 ? (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.textFaint, fontWeight: 700, marginBottom: 6 }}>
            NO TRANSACTIONS YET
          </div>
          <p style={{ fontSize: 13, color: '#C0BEB9' }}>Trades, signings, waivers, and draft picks will show up here.</p>
        </div>
      ) : (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          {transactions.map((tx) => {
            const st = TX_STYLE[tx.type]
            return (
              <div
                key={tx.id}
                className="hover-row"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: `1px solid ${COLORS.bg}` }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      fontWeight: 600,
                      color: st.color,
                      background: st.bg,
                      padding: '2px 7px',
                      letterSpacing: 1
                    }}
                  >
                    {tx.type}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                    {tx.headline}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted }}>{tx.detail}</div>
                </div>
                <span style={{ flexShrink: 0, fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, whiteSpace: 'nowrap', marginTop: 3 }}>
                  {tx.date}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
