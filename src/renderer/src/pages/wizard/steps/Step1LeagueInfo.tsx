import { COLORS, FONTS } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'

export default function Step1LeagueInfo(): React.JSX.Element {
  const leagueName = useWizardStore((s) => s.leagueName)
  const teamsCount = useWizardStore((s) => s.teamsCount)
  const gamesPerSeason = useWizardStore((s) => s.gamesPerSeason)
  const setLeagueName = useWizardStore((s) => s.setLeagueName)
  const setTeamsCount = useWizardStore((s) => s.setTeamsCount)
  const setGamesPerSeason = useWizardStore((s) => s.setGamesPerSeason)

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
          Step 1 of 6
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
          League Info
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Set the name and basic structure of your league.
        </p>
      </div>

      <div style={{ marginBottom: 40, maxWidth: 500 }}>
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 10
          }}
        >
          League Name
        </label>
        <input
          type="text"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.textPrimary,
            background: 'white',
            border: `1.5px solid ${COLORS.border}`,
            outline: 'none',
            fontFamily: FONTS.body
          }}
        />
      </div>

      <div style={{ marginBottom: 40, maxWidth: 500 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 10
          }}
        >
          <label
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              letterSpacing: 3,
              textTransform: 'uppercase'
            }}
          >
            Number of Teams
          </label>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 34,
              fontWeight: 900,
              color: COLORS.textPrimary,
              lineHeight: 1
            }}
          >
            {teamsCount}
          </span>
        </div>
        <input
          type="range"
          min={8}
          max={32}
          step={2}
          value={teamsCount}
          onChange={(e) => setTeamsCount(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>8</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>32</span>
        </div>
      </div>

      <div style={{ maxWidth: 500 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 10
          }}
        >
          <label
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.textMuted,
              letterSpacing: 3,
              textTransform: 'uppercase'
            }}
          >
            Games per Season
          </label>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 34,
              fontWeight: 900,
              color: COLORS.textPrimary,
              lineHeight: 1
            }}
          >
            {gamesPerSeason}
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={100}
          step={2}
          value={gamesPerSeason}
          onChange={(e) => setGamesPerSeason(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>20</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>100</span>
        </div>
      </div>
    </div>
  )
}
