import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, fmtMoney } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const labelStyle = {
  fontFamily: FONTS.mono,
  fontSize: 9,
  color: COLORS.textFaint,
  letterSpacing: 2,
  textTransform: 'uppercase' as const,
  marginBottom: 4
}

const bigValueStyle = {
  fontFamily: FONTS.display,
  fontWeight: 900,
  fontSize: 30
}

export default function SalaryCap(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const config = useGameStore((s) => s.config)

  const capLimit = (config?.salaryCap ?? 136) * 1e6
  const luxTax = Math.round(capLimit * 1.2132)
  const totalSalary = myRoster.reduce((a, p) => a + p.salary, 0)
  const overCap = totalSalary - capLimit
  const maxSal = Math.max(...myRoster.map((p) => p.salary), 1)

  const payrollBarW = Math.min(98, Math.round((totalSalary / (capLimit * 1.25)) * 100)) + '%'
  const capLinePos = Math.round((capLimit / (capLimit * 1.25)) * 100) + '%'
  const luxLinePos = Math.round((luxTax / (capLimit * 1.25)) * 100) + '%'
  const overCapColor = overCap > 0 ? COLORS.accent : 'oklch(0.45 0.18 140)'
  const luxuryStatus = totalSalary < luxTax ? 'Under Tax' : 'Luxury Tax'
  const luxuryColor = totalSalary < luxTax ? 'oklch(0.45 0.18 140)' : COLORS.lossRed

  const salaryBreakdown = [...myRoster]
    .sort((a, b) => b.salary - a.salary)
    .map((p) => ({
      ...p,
      barWidth: Math.round((p.salary / maxSal) * 100) + '%',
      barColor: p.salary > 20000000 ? COLORS.accent : p.salary > 10000000 ? COLORS.ovrB : COLORS.ovrC
    }))

  return (
    <PageShell maxWidth={900}>
      <PageHeader title="Salary Cap" />
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 24, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
          <div>
            <div style={labelStyle}>Total Payroll</div>
            <div style={{ ...bigValueStyle, color: overCapColor }}>${(totalSalary / 1e6).toFixed(1)}M</div>
          </div>
          <div>
            <div style={labelStyle}>Salary Cap</div>
            <div style={{ ...bigValueStyle, color: COLORS.textPrimary }}>${(capLimit / 1e6).toFixed(0)}M</div>
          </div>
          <div>
            <div style={labelStyle}>Over Cap</div>
            <div style={{ ...bigValueStyle, color: COLORS.accent }}>${(overCap / 1e6).toFixed(1)}M</div>
          </div>
          <div>
            <div style={labelStyle}>Luxury Tax</div>
            <div style={{ ...bigValueStyle, color: luxuryColor }}>{luxuryStatus}</div>
          </div>
        </div>
        <div style={{ position: 'relative', height: 28, background: COLORS.bg, overflow: 'hidden', marginBottom: 8 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              background: COLORS.accent,
              width: payrollBarW,
              transition: 'width 0.4s'
            }}
          />
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: COLORS.textPrimary, left: capLinePos }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: COLORS.lossRed, left: luxLinePos }} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, background: COLORS.accent }}></div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>Payroll</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, background: COLORS.textPrimary }}></div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
              Salary Cap ${(capLimit / 1e6).toFixed(0)}M
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, background: COLORS.lossRed }}></div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
              Luxury Tax ${(luxTax / 1e6).toFixed(0)}M
            </span>
          </div>
        </div>
      </div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, letterSpacing: 2, textTransform: 'uppercase' }}>
            Player Breakdown
          </span>
        </div>
        {salaryBreakdown.map((p) => (
          <div
            key={p.id}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 18px', borderBottom: `1px solid ${COLORS.bg}` }}
          >
            <div style={{ flex: '0 0 140px', fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
              {p.name}
            </div>
            <div style={{ flex: '0 0 36px', fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textMuted, textAlign: 'center' }}>
              {p.pos}
            </div>
            <div style={{ flex: 1, height: 10, background: COLORS.bg, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: p.barColor, width: p.barWidth }} />
            </div>
            <div
              style={{
                flex: '0 0 80px',
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.textPrimary,
                textAlign: 'right',
                fontWeight: 500
              }}
            >
              {fmtMoney(p.salary)}
            </div>
            <div style={{ flex: '0 0 40px', fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, textAlign: 'right' }}>
              {p.yrs}yr
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
