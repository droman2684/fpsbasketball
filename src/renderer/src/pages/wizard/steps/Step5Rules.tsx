import { COLORS, FONTS, seg } from '@renderer/styles/theme'
import { getRoundCount, getRoundLabel, useWizardStore } from '@renderer/state/wizardStore'

const ROUND_GAME_OPTIONS = [3, 5, 7] as const

export default function Step5Rules(): React.JSX.Element {
  const playoffTeamsPerConf = useWizardStore((s) => s.playoffTeamsPerConf)
  const roundGames = useWizardStore((s) => s.roundGames)
  const salaryCap = useWizardStore((s) => s.salaryCap)
  const hardCap = useWizardStore((s) => s.hardCap)
  const setPlayoffTeams = useWizardStore((s) => s.setPlayoffTeams)
  const setRoundGames = useWizardStore((s) => s.setRoundGames)
  const setSalaryCap = useWizardStore((s) => s.setSalaryCap)
  const setHardCap = useWizardStore((s) => s.setHardCap)

  const roundCount = getRoundCount(playoffTeamsPerConf)
  const roundItems = Array(roundCount)
    .fill(0)
    .map((_, i) => ({
      index: i,
      label: getRoundLabel(i, roundCount),
      games: roundGames[i] || 7
    }))

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
          Step 5 of 6
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
          League Rules
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Configure playoff structure and financial settings.
        </p>
      </div>

      <div style={{ marginBottom: 44, maxWidth: 500 }}>
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
            Playoff Teams per Conference
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
            {playoffTeamsPerConf}
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={16}
          step={2}
          value={playoffTeamsPerConf}
          onChange={(e) => setPlayoffTeams(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>2</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>16</span>
        </div>
      </div>

      <div style={{ marginBottom: 44, maxWidth: 560 }}>
        <label
          style={{
            display: 'block',
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textMuted,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 14
          }}
        >
          Playoff Format
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {roundItems.map((round) => (
            <div
              key={round.index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'white',
                border: `1px solid ${COLORS.border}`,
                padding: '12px 16px'
              }}
            >
              <span
                style={{
                  flex: '0 0 148px',
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  fontWeight: 500,
                  color: COLORS.textPrimary
                }}
              >
                {round.label}
              </span>
              <div style={{ display: 'flex', gap: 0 }}>
                {ROUND_GAME_OPTIONS.map((games, i) => {
                  const active = round.games === games
                  return (
                    <button
                      key={games}
                      onClick={() => setRoundGames(round.index, games)}
                      style={{
                        padding: '7px 13px',
                        background: seg.bg(active),
                        color: seg.fg(active),
                        border: `1px solid ${seg.border(active)}`,
                        fontFamily: FONTS.display,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                        marginRight: i === ROUND_GAME_OPTIONS.length - 1 ? 0 : -1,
                        position: 'relative',
                        zIndex: seg.z(active),
                        letterSpacing: 0.5
                      }}
                    >
                      Best of {games}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 40 }}>
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
          Salary Cap
        </label>
        <div style={{ display: 'flex', alignItems: 'stretch', maxWidth: 260 }}>
          <span
            style={{
              background: '#EDECE9',
              padding: '12px 13px',
              fontFamily: FONTS.mono,
              fontSize: 14,
              color: COLORS.textMuted,
              border: `1.5px solid ${COLORS.border}`,
              borderRight: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            $
          </span>
          <input
            type="number"
            value={salaryCap}
            onChange={(e) => setSalaryCap(Number(e.target.value))}
            min={50}
            max={500}
            step={1}
            style={{
              width: 90,
              padding: '12px 14px',
              fontSize: 20,
              fontWeight: 900,
              color: COLORS.textPrimary,
              background: 'white',
              border: `1.5px solid ${COLORS.border}`,
              outline: 'none',
              fontFamily: FONTS.display
            }}
          />
          <span
            style={{
              background: '#EDECE9',
              padding: '12px 13px',
              fontFamily: FONTS.mono,
              fontSize: 12,
              color: COLORS.textMuted,
              border: `1.5px solid ${COLORS.border}`,
              borderLeft: 'none',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: 1
            }}
          >
            MILLION
          </span>
        </div>
      </div>

      <div>
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
          Cap Type
        </label>
        <div style={{ display: 'flex', gap: 0, maxWidth: 260 }}>
          <button
            onClick={() => setHardCap(true)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: seg.bg(hardCap),
              color: seg.fg(hardCap),
              border: `1.5px solid ${seg.border(hardCap)}`,
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginRight: -1.5,
              position: 'relative',
              zIndex: seg.z(hardCap)
            }}
          >
            Hard Cap
          </button>
          <button
            onClick={() => setHardCap(false)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: seg.bg(!hardCap),
              color: seg.fg(!hardCap),
              border: `1.5px solid ${seg.border(!hardCap)}`,
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: 1,
              cursor: 'pointer',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: seg.z(!hardCap)
            }}
          >
            Soft Cap
          </button>
        </div>
        <p style={{ marginTop: 8, fontSize: 13, color: COLORS.textFaint, fontFamily: FONTS.body }}>
          Hard Cap: teams cannot exceed the limit at any time.
        </p>
      </div>
    </div>
  )
}
