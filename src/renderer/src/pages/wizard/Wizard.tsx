import { COLORS, FONTS } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'
import Step1LeagueInfo from './steps/Step1LeagueInfo'
import Step2Conferences from './steps/Step2Conferences'
import Step3Teams from './steps/Step3Teams'
import Step4YourTeam from './steps/Step4YourTeam'
import Step5Rules from './steps/Step5Rules'
import Step6Review from './steps/Step6Review'

const STEP_LABELS = ['League Info', 'Conferences', 'Teams', 'Your Team', 'Rules', 'Review']

interface WizardProps {
  onLaunch: () => void
}

export default function Wizard({ onLaunch }: WizardProps): React.JSX.Element {
  const wizardStep = useWizardStore((s) => s.wizardStep)
  const backToLanding = useWizardStore((s) => s.backToLanding)
  const goBack = useWizardStore((s) => s.goBack)
  const goNext = useWizardStore((s) => s.goNext)

  const progressPct = Math.round(((wizardStep - 1) / 5) * 100)
  const canGoBack = wizardStep > 1
  const showNextBtn = wizardStep < 6

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }} className="pg">
      {/* Sidebar */}
      <div
        style={{
          flex: '0 0 252px',
          background: COLORS.sidebarDark,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '24px 26px 18px' }}>
          <button
            onClick={backToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: '#5A5A56',
              cursor: 'pointer',
              padding: 0,
              fontFamily: FONTS.body,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: 0.3
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ padding: '0 26px 28px', borderBottom: '1px solid #242420' }}>
          <div>
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 20,
                color: '#FFFFFF',
                letterSpacing: -0.3
              }}
            >
              FRONT PAGE
            </span>
            <br />
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 20,
                color: COLORS.accent,
                letterSpacing: -0.3
              }}
            >
              SPORTS
            </span>
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: '#3A3A36',
              letterSpacing: 3,
              marginTop: 3,
              textTransform: 'uppercase'
            }}
          >
            Basketball 2026 · League Creation
          </div>
        </div>

        <div style={{ padding: '24px 0', flex: 1 }}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1
            const active = wizardStep === num
            const done = wizardStep > num
            return (
              <div
                key={label}
                style={{ padding: '9px 26px', display: 'flex', alignItems: 'center', gap: 13 }}
              >
                {done ? (
                  <>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 27,
                        height: 27,
                        borderRadius: '50%',
                        background: COLORS.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: 'white',
                        fontWeight: 700
                      }}
                    >
                      ✓
                    </div>
                    <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 400, color: '#5A5A56' }}>
                      {label}
                    </span>
                  </>
                ) : active ? (
                  <>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 27,
                        height: 27,
                        borderRadius: '50%',
                        background: COLORS.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: FONTS.display,
                        fontWeight: 900,
                        fontSize: 14,
                        color: 'white'
                      }}
                    >
                      {num}
                    </div>
                    <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: 'white' }}>
                      {label}
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 27,
                        height: 27,
                        borderRadius: '50%',
                        background: '#232320',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: FONTS.display,
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#3A3A36'
                      }}
                    >
                      {num}
                    </div>
                    <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 400, color: '#343430' }}>
                      {label}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ padding: '20px 26px 28px' }}>
          <div style={{ height: 3, background: '#232320', overflow: 'hidden', marginBottom: 8 }}>
            <div
              style={{
                height: '100%',
                background: COLORS.accent,
                width: `${progressPct}%`,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: '#3A3A36',
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Step {wizardStep} of 6
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: COLORS.bg,
          minWidth: 0
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: '52px 68px 36px' }}>
          {wizardStep === 1 ? <Step1LeagueInfo /> : null}
          {wizardStep === 2 ? <Step2Conferences /> : null}
          {wizardStep === 3 ? <Step3Teams /> : null}
          {wizardStep === 4 ? <Step4YourTeam /> : null}
          {wizardStep === 5 ? <Step5Rules /> : null}
          {wizardStep === 6 ? <Step6Review onLaunch={onLaunch} /> : null}
        </div>

        {/* Bottom nav */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px 68px',
            background: 'white',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 72
          }}
        >
          {canGoBack ? (
            <button
              onClick={goBack}
              className="cta-btn"
              style={{
                padding: '11px 26px',
                background: 'white',
                color: COLORS.textPrimary,
                border: `1.5px solid ${COLORS.border}`,
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              ← BACK
            </button>
          ) : (
            <span />
          )}
          {showNextBtn ? (
            <button
              onClick={goNext}
              className="cta-btn"
              style={{
                padding: '11px 32px',
                background: COLORS.accent,
                color: 'white',
                border: 'none',
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              NEXT →
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
