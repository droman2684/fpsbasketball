import { COLORS, FONTS, seg } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'

const CONF_COUNTS = [1, 2, 3, 4] as const
const DIV_COUNTS = [
  { value: 0 as const, label: 'None' },
  { value: 2 as const, label: '2' },
  { value: 3 as const, label: '3' }
]

export default function Step2Conferences(): React.JSX.Element {
  const conferences = useWizardStore((s) => s.conferences)
  const divsPerConf = useWizardStore((s) => s.divsPerConf)
  const setConfCount = useWizardStore((s) => s.setConfCount)
  const setDivsPerConf = useWizardStore((s) => s.setDivsPerConf)
  const setConfName = useWizardStore((s) => s.setConfName)
  const setDivName = useWizardStore((s) => s.setDivName)

  const confCount = conferences.length
  const hasDivisions = divsPerConf > 0

  return (
    <div className="step-in">
      <div style={{ marginBottom: 44 }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.accent,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 10
          }}
        >
          Step 2 of 6
        </div>
        <h1
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 54,
            color: COLORS.textPrimary,
            letterSpacing: -1.5,
            lineHeight: 1,
            marginBottom: 8
          }}
        >
          Conferences
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Configure conferences and divisions for your league.
        </p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 12
          }}
        >
          Number of Conferences
        </label>
        <div style={{ display: 'flex', gap: 0 }}>
          {CONF_COUNTS.map((n, i) => {
            const active = confCount === n
            return (
              <button
                key={n}
                onClick={() => setConfCount(n)}
                style={{
                  width: 52,
                  height: 44,
                  background: seg.bg(active),
                  color: seg.fg(active),
                  border: `1.5px solid ${seg.border(active)}`,
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 20,
                  cursor: 'pointer',
                  marginRight: i === CONF_COUNTS.length - 1 ? 0 : -1.5,
                  position: 'relative',
                  zIndex: seg.z(active)
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 44 }}>
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 12
          }}
        >
          Divisions per Conference
        </label>
        <div style={{ display: 'flex', gap: 0 }}>
          {DIV_COUNTS.map((d, i) => {
            const active = divsPerConf === d.value
            return (
              <button
                key={d.value}
                onClick={() => setDivsPerConf(d.value)}
                style={{
                  padding: '11px 22px',
                  background: seg.bg(active),
                  color: seg.fg(active),
                  border: `1.5px solid ${seg.border(active)}`,
                  fontFamily: FONTS.display,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  letterSpacing: 1,
                  textTransform: d.value === 0 ? 'uppercase' : 'none',
                  marginRight: i === DIV_COUNTS.length - 1 ? 0 : -1.5,
                  position: 'relative',
                  zIndex: seg.z(active)
                }}
              >
                {d.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 580 }}>
        {conferences.map((conf, ci) => (
          <div key={ci} style={{ background: 'white', border: `1px solid ${COLORS.border}`, padding: 22 }}>
            <div style={{ marginBottom: hasDivisions ? 20 : 0 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 7
                }}
              >
                Conference {ci + 1}
              </label>
              <input
                type="text"
                value={conf.name}
                onChange={(e) => setConfName(ci, e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 15px',
                  fontSize: 16,
                  fontWeight: 500,
                  color: COLORS.textPrimary,
                  background: COLORS.bg,
                  border: `1.5px solid ${COLORS.border}`,
                  outline: 'none',
                  fontFamily: FONTS.body
                }}
              />
            </div>
            {hasDivisions ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  borderLeft: `3px solid ${COLORS.accent}`,
                  paddingLeft: 16
                }}
              >
                {conf.divisions.map((div, di) => (
                  <div key={di}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: FONTS.mono,
                        fontSize: 9,
                        color: COLORS.textFaint,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        marginBottom: 5
                      }}
                    >
                      Division {di + 1}
                    </label>
                    <input
                      type="text"
                      value={div}
                      onChange={(e) => setDivName(ci, di, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 13px',
                        fontSize: 14,
                        color: COLORS.textPrimary,
                        background: 'white',
                        border: `1px solid ${COLORS.border}`,
                        outline: 'none',
                        fontFamily: FONTS.body
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
