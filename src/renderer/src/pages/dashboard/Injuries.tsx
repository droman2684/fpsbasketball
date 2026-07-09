import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import type { SimDate } from '@shared/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// RosterPlayer only carries a status enum + a return day, not free-text
// injury details, so the label/color here is presentational flavor mapped
// locally from status — not read from or written to the store. The actual
// "is this player hurt" and "when do they return" facts come straight from
// live roster data (status / injuryReturnDay) below.
const STATUS_META: Record<string, { injury: string; color: string; bg: string }> = {
  OUT: { injury: 'Lower Body Injury', color: '#CE1141', bg: 'oklch(0.95 0.04 15)' },
  INJ: { injury: 'Ankle Sprain', color: COLORS.accent, bg: 'oklch(0.95 0.04 42)' },
  GTD: { injury: 'Day-to-Day', color: COLORS.textMuted, bg: COLORS.bg }
}

function formatReturnDate(simDate: SimDate, offsetDays: number): string {
  const dt = new Date(simDate.y, simDate.m - 1, simDate.d + offsetDays)
  return `~${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
}

const GRID_COLS = '1fr 52px 1fr 80px 140px'

export default function Injuries(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const simDate = useGameStore((s) => s.simDate)
  const simDay = useGameStore((s) => s.simDay)

  const injuryList = myRoster.filter((p) => p.status !== 'Active')

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Injury Report" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            padding: '7px 18px',
            background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            gap: 4
          }}
        >
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>PLAYER</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>POS</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>INJURY</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint, textAlign: 'center' }}>
            STATUS
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>EST. RETURN</span>
        </div>
        {injuryList.length === 0 && (
          <div style={{ padding: '28px 18px', textAlign: 'center' }}>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
              No one&apos;s hurt right now — full health across the roster.
            </span>
          </div>
        )}
        {injuryList.map((p) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.GTD
          const returnDate =
            p.injuryReturnDay !== undefined
              ? formatReturnDate(simDate, Math.max(0, p.injuryReturnDay - simDay))
              : 'Day-to-Day'
          return (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                padding: '12px 18px',
                borderBottom: `1px solid ${COLORS.bg}`,
                gap: 4,
                alignItems: 'center'
              }}
            >
              <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                {p.name}
              </span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>{p.pos}</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textPrimary }}>{meta.injury}</span>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    fontWeight: 600,
                    color: meta.color,
                    background: meta.bg,
                    padding: '3px 8px',
                    letterSpacing: 1
                  }}
                >
                  {p.status}
                </span>
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>{returnDate}</span>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
