import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

export default function DraftOrder(): React.JSX.Element {
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const myTeam = useGameStore((s) => s.myTeam)

  const sorted = [...leagueTeams].sort((a, b) => {
    const ra = records[a.abbr] ?? { w: 0, l: 0 }
    const rb = records[b.abbr] ?? { w: 0, l: 0 }
    return ra.w - rb.w || rb.l - ra.l
  })

  const draftOrder = sorted.map((t, i) => {
    const r = records[t.abbr] ?? { w: 0, l: 0 }
    const pct = (r.w / (r.w + r.l + 0.01)).toFixed(3).replace(/^0/, '')
    const mine = t.abbr === myTeam
    return {
      ...t,
      w: r.w,
      l: r.l,
      pick: i + 1,
      pct,
      pickColor: i < 5 ? COLORS.accent : i < 14 ? COLORS.ovrB : COLORS.textFaint,
      nameColor: mine ? 'oklch(0.45 0.19 42)' : COLORS.textPrimary,
      rowBg: mine ? 'oklch(0.99 0.007 42)' : COLORS.surface,
      fw: mine ? 700 : 400
    }
  })

  return (
    <PageShell maxWidth={800}>
      <PageHeader title="Draft Order" subtitle="Based on current standings — lottery adjustments pending" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        {draftOrder.map((t) => (
          <div
            key={t.abbr}
            className="hover-fade"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 18px',
              borderBottom: `1px solid ${COLORS.bg}`,
              background: t.rowBg
            }}
          >
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: t.pickColor, width: 36, flexShrink: 0 }}>
              {t.pick}
            </span>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.primary, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: t.fw, color: t.nameColor }}>
                {t.city} {t.name}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>
                {t.w}–{t.l}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>{t.pct}</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
