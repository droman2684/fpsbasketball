import { NBA_TEAMS } from '@renderer/data/teams'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'

interface PickItem {
  abbr: string
  name: string
  city: string
  primary: string
  textColor: string
}

export default function Step4YourTeam(): React.JSX.Element {
  const selectedTeams = useWizardStore((s) => s.selectedTeams)
  const fictionalTeams = useWizardStore((s) => s.fictionalTeams)
  const myTeam = useWizardStore((s) => s.myTeam)
  const pickMyTeam = useWizardStore((s) => s.pickMyTeam)

  const pickTeamItems: PickItem[] = [
    ...NBA_TEAMS.filter((t) => selectedTeams.includes(t.abbr)).map((t) => ({
      abbr: t.abbr,
      name: t.name,
      city: t.city,
      primary: t.primary,
      textColor: getTextColor(t.primary)
    })),
    ...fictionalTeams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      city: t.city,
      primary: t.primary,
      textColor: getTextColor(t.primary)
    }))
  ]

  const myTeamInfo = pickTeamItems.find((t) => t.abbr === myTeam) ?? null
  const hasMyTeam = !!myTeamInfo

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
          Step 4 of 6
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
          Your Team
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Pick the franchise you&apos;ll manage as General Manager.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 7,
          maxWidth: 720,
          marginBottom: 28
        }}
      >
        {pickTeamItems.map((team) => {
          const isMyTeam = team.abbr === myTeam
          return (
            <div
              key={team.abbr}
              onClick={() => pickMyTeam(team.abbr)}
              style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2.5px solid ${isMyTeam ? COLORS.accent : COLORS.border}`,
                boxShadow: isMyTeam ? `0 0 0 2px ${COLORS.accent}` : 'none'
              }}
            >
              <div
                style={{
                  background: team.primary,
                  padding: '10px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '1.3'
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    color: team.textColor,
                    letterSpacing: 2
                  }}
                >
                  {team.abbr}
                </span>
              </div>
              <div style={{ background: 'white', padding: '5px 5px 7px', textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {team.city}
                </div>
              </div>
              {isMyTeam ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: COLORS.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'white',
                    lineHeight: 1
                  }}
                >
                  ★
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {hasMyTeam && myTeamInfo ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            background: 'white',
            border: `2px solid ${COLORS.accent}`
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: myTeamInfo.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 13,
                color: myTeamInfo.textColor,
                letterSpacing: 1
              }}
            >
              {myTeamInfo.abbr}
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 20,
                color: COLORS.textPrimary,
                letterSpacing: -0.3
              }}
            >
              {myTeamInfo.city} {myTeamInfo.name}
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.accent,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginTop: 2
              }}
            >
              Your Franchise
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
