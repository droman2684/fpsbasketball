import { NBA_TEAMS } from '@renderer/data/teams'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'
import { getRoundCount, getRoundLabel, useWizardStore } from '@renderer/state/wizardStore'

interface Step6ReviewProps {
  onLaunch: () => void
}

export default function Step6Review({ onLaunch }: Step6ReviewProps): React.JSX.Element {
  const leagueName = useWizardStore((s) => s.leagueName)
  const gamesPerSeason = useWizardStore((s) => s.gamesPerSeason)
  const conferences = useWizardStore((s) => s.conferences)
  const selectedTeams = useWizardStore((s) => s.selectedTeams)
  const fictionalTeams = useWizardStore((s) => s.fictionalTeams)
  const myTeam = useWizardStore((s) => s.myTeam)
  const playoffTeamsPerConf = useWizardStore((s) => s.playoffTeamsPerConf)
  const roundGames = useWizardStore((s) => s.roundGames)
  const salaryCap = useWizardStore((s) => s.salaryCap)
  const hardCap = useWizardStore((s) => s.hardCap)

  const summaryTeams = selectedTeams.length + fictionalTeams.length
  const summaryConfs = conferences.length
  const summaryConfNames = conferences.map((c) => c.name).join(', ')
  const summaryDivisions = conferences.reduce((acc, c) => acc + c.divisions.length, 0)

  const roundCount = getRoundCount(playoffTeamsPerConf)
  const summaryRoundList = Array(roundCount)
    .fill(0)
    .map((_, i) => ({ label: getRoundLabel(i, roundCount), games: roundGames[i] || 7 }))

  const myTeamData =
    NBA_TEAMS.find((t) => t.abbr === myTeam) ?? fictionalTeams.find((t) => t.abbr === myTeam) ?? null
  const myTeamAbbr = myTeamData?.abbr ?? ''
  const myTeamFullName = myTeamData ? `${myTeamData.city} ${myTeamData.name}` : ''
  const myTeamColor = myTeamData?.primary ?? COLORS.border
  const myTeamTextColor = myTeamData ? getTextColor(myTeamData.primary) : COLORS.textPrimary

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
          Step 6 of 6
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
          Review &amp; Launch
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Your league is ready. Review everything and start Season 1.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          maxWidth: 640,
          marginBottom: 44
        }}
      >
        <div
          style={{
            background: COLORS.accent,
            border: 'none',
            padding: 22,
            gridColumn: '1 / -1',
            display: 'flex',
            alignItems: 'center',
            gap: 18
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: myTeamColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 14,
                color: myTeamTextColor,
                letterSpacing: 1
              }}
            >
              {myTeamAbbr}
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginBottom: 4
              }}
            >
              Your Franchise
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 26,
                color: 'white',
                letterSpacing: -0.5
              }}
            >
              {myTeamFullName}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, padding: 22 }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.accent,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            League
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 22,
              color: COLORS.textPrimary,
              marginBottom: 6,
              letterSpacing: -0.3
            }}
          >
            {leagueName}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
            {summaryTeams} teams · {gamesPerSeason} games/season
          </div>
        </div>

        <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, padding: 22 }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.accent,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Structure
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 22,
              color: COLORS.textPrimary,
              marginBottom: 6,
              letterSpacing: -0.3
            }}
          >
            {summaryConfs} Conferences
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>{summaryConfNames}</div>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 3 }}>
            {summaryDivisions} divisions total
          </div>
        </div>

        <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, padding: 22 }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.accent,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Playoffs
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 22,
              color: COLORS.textPrimary,
              marginBottom: 8,
              letterSpacing: -0.3
            }}
          >
            {playoffTeamsPerConf} teams / conf
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {summaryRoundList.map((rnd) => (
              <div key={rnd.label} style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: FONTS.mono }}>
                {rnd.label}: Best of {rnd.games}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', border: `1px solid ${COLORS.border}`, padding: 22 }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.accent,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            Financials
          </div>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 22,
              color: COLORS.textPrimary,
              marginBottom: 6,
              letterSpacing: -0.3
            }}
          >
            ${salaryCap}M Cap
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{hardCap ? 'Hard Cap' : 'Soft Cap'}</div>
        </div>
      </div>

      <button
        onClick={onLaunch}
        className="cta-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          background: COLORS.accent,
          color: 'white',
          border: 'none',
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: 3,
          textTransform: 'uppercase',
          cursor: 'pointer',
          minWidth: 380
        }}
      >
        START SEASON 1
        <span style={{ fontWeight: 200, fontSize: 26, opacity: 0.75, marginLeft: 20 }}>→</span>
      </button>
    </div>
  )
}
