import { NBA_TEAMS } from '@renderer/data/teams'
import { COLORS, FONTS } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'

// 40-cell collage padded out from the 30 real teams (repeating), matching the
// design spec's `teamCollage` derivation.
function buildTeamCollage(): { primary: string }[] {
  const base = NBA_TEAMS.map((t) => ({ primary: t.primary }))
  while (base.length < 40) base.push(base[base.length % 30])
  return base
}

export default function Landing(): React.JSX.Element {
  const goCreate = useWizardStore((s) => s.goCreate)
  const goLoad = useWizardStore((s) => s.goLoad)
  const collage = buildTeamCollage()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }} className="pg">
      {/* Left panel */}
      <div
        style={{
          flex: '0 0 52%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 72px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: 4,
              color: COLORS.textFaint,
              textTransform: 'uppercase'
            }}
          >
            Basketball · 2026
          </span>
        </div>

        <div style={{ marginBottom: 2, lineHeight: 0.86 }}>
          <span
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 72,
              letterSpacing: -2,
              color: COLORS.textPrimary,
              display: 'block',
              lineHeight: 0.9
            }}
          >
            FRONT PAGE
          </span>
          <span
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 72,
              letterSpacing: -2,
              color: COLORS.accent,
              display: 'block',
              lineHeight: 0.9
            }}
          >
            SPORTS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0 10px' }}>
          <div style={{ width: 40, height: 3, background: COLORS.accent }} />
          <span
            style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 5,
              color: COLORS.textMuted,
              textTransform: 'uppercase'
            }}
          >
            General Manager · Career Mode
          </span>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: 3,
              color: COLORS.textFaint,
              textTransform: 'uppercase'
            }}
          >
            2026 Edition
          </span>
        </div>

        <p
          style={{
            fontSize: 14,
            color: COLORS.textFaint,
            lineHeight: 1.6,
            marginBottom: 52,
            maxWidth: 300,
            fontWeight: 400,
            letterSpacing: 0.2
          }}
        >
          Build dynasties. Trade legends.
          <br />
          Coach champions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
          <button
            onClick={goCreate}
            className="cta-btn"
            style={{
              width: '100%',
              padding: '19px 28px',
              background: COLORS.accent,
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            CREATE NEW LEAGUE
            <span style={{ fontWeight: 200, fontSize: 22, opacity: 0.75, marginLeft: 12 }}>→</span>
          </button>
          <button
            onClick={goLoad}
            className="cta-btn"
            style={{
              width: '100%',
              padding: '19px 28px',
              background: 'white',
              color: COLORS.textPrimary,
              border: `1.5px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            LOAD LEAGUE
            <span style={{ fontWeight: 200, fontSize: 22, color: COLORS.textFaint, marginLeft: 12 }}>
              →
            </span>
          </button>
        </div>

        <div style={{ marginTop: 56 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: '#D0CEC9',
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            Front Page Sports · Basketball 2026
          </span>
        </div>
      </div>

      {/* Right panel: team collage */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(150deg, #EFECEA 0%, #E8E5DF 100%)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, #F7F6F3 0%, transparent 22%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-18%',
            left: '-6%',
            right: '-6%',
            bottom: '-18%',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 18,
            transform: 'rotate(-7deg)',
            padding: 20,
            alignContent: 'start'
          }}
        >
          {collage.map((tc, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                background: tc.primary,
                boxShadow: '0 3px 14px rgba(0,0,0,0.11)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
