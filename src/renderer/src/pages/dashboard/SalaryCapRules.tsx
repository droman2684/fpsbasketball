import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

interface CapRow {
  label: string
  desc: string
  value: string
  valColor: string
}

export default function SalaryCapRules(): React.JSX.Element {
  const config = useGameStore((s) => s.config)

  const cap = config?.salaryCap ?? 0
  const hardCap = config?.hardCap ?? true

  const capRuleItems: CapRow[] = [
    {
      label: 'Salary Cap',
      desc: hardCap ? 'HARD CAP ENABLED — TEAMS CANNOT EXCEED AT ANY TIME' : 'SOFT CAP — TEAMS MAY EXCEED VIA EXCEPTIONS',
      value: `$${cap}M`,
      valColor: COLORS.accent
    },
    {
      label: 'Luxury Tax Threshold',
      desc: 'TEAMS ABOVE THIS LINE PAY A 1.5X TAX PENALTY',
      value: `$${Math.round(cap * 1.2132)}M`,
      valColor: COLORS.lossRed
    },
    {
      label: 'Minimum Team Payroll',
      desc: 'ALL TEAMS MUST REACH THIS FLOOR',
      value: `$${Math.round(cap * 0.846)}M`,
      valColor: COLORS.ovrB
    },
    {
      label: 'Mid-Level Exception',
      desc: 'AVAILABLE ANNUALLY TO OVER-CAP TEAMS',
      value: `$${(cap * 0.091).toFixed(1)}M`,
      valColor: COLORS.textPrimary
    },
    {
      label: 'Rookie Scale',
      desc: '1ST ROUND PICKS RECEIVE SLOT CONTRACTS',
      value: 'Enabled',
      valColor: 'oklch(0.45 0.18 140)'
    }
  ]

  return (
    <PageShell maxWidth={800}>
      <PageHeader title="Salary Cap Rules" />
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        {capRuleItems.map((r) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 20,
              borderBottom: `1px solid ${COLORS.bg}`
            }}
          >
            <div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 3 }}>
                {r.label}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, letterSpacing: 1 }}>{r.desc}</div>
            </div>
            <div style={{ flexShrink: 0, marginLeft: 24 }}>
              <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: r.valColor }}>{r.value}</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
