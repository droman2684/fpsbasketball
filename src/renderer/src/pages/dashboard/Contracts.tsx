import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, fmtMoney } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const GRID_COLS = '1fr 52px 100px 60px 80px 120px'

const headerCellStyle = {
  fontFamily: FONTS.mono,
  fontSize: 8,
  color: COLORS.textFaint
}

export default function Contracts(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)

  const contractList = [...myRoster]
    .sort((a, b) => b.salary - a.salary)
    .map((p) => {
      const elig = p.yrs >= 2 && p.age <= 30 && p.ovr >= 75
      const expires = `${2026 + p.yrs - 1}-${String(2027 + p.yrs - 1).slice(2)}`
      return {
        ...p,
        expires,
        extLabel: elig ? 'ELIGIBLE' : '—',
        extColor: elig ? 'oklch(0.45 0.18 140)' : COLORS.textFaint,
        extBg: elig ? 'oklch(0.94 0.04 140)' : COLORS.bg
      }
    })

  return (
    <PageShell maxWidth={1000}>
      <PageHeader title="Contracts" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
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
          <span style={headerCellStyle}>PLAYER</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>POS</span>
          <span style={{ ...headerCellStyle, textAlign: 'right' }}>SALARY</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>YRS</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>EXT ELG</span>
          <span style={{ ...headerCellStyle, textAlign: 'center' }}>EXPIRES</span>
        </div>
        {contractList.map((p) => (
          <div
            key={p.id}
            className="hover-row"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLS,
              padding: '10px 18px',
              borderBottom: `1px solid ${COLORS.bg}`,
              gap: 4,
              alignItems: 'center'
            }}
          >
            <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textPrimary, textAlign: 'right', fontWeight: 500 }}>
              {fmtMoney(p.salary)}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.yrs}</span>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: p.extColor,
                  background: p.extBg,
                  padding: '2px 6px',
                  letterSpacing: 1
                }}
              >
                {p.extLabel}
              </span>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.expires}</span>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
