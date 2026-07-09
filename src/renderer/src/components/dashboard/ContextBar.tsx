import { useGameStore } from '@renderer/state/gameStore'
import { MONTHS } from '@renderer/data/players'
import { COLORS, FONTS } from '@renderer/styles/theme'

// Recent-form pill for the L5 strip on the far right of the context bar.
interface FormPill {
  label: 'W' | 'L'
  bg: string
  color: string
}

export default function ContextBar(): React.JSX.Element {
  const simDay = useGameStore((s) => s.simDay)
  const simDate = useGameStore((s) => s.simDate)
  const config = useGameStore((s) => s.config)
  const simResults = useGameStore((s) => s.simResults)
  const seasonPhase = useGameStore((s) => s.seasonPhase)
  const seasonNumber = useGameStore((s) => s.seasonNumber)
  const goToPage = useGameStore((s) => s.goToPage)

  const gamesPerSeason = config?.gamesPerSeason ?? 82
  const simDateStr = `${MONTHS[simDate.m - 1]} ${simDate.d}, ${simDate.y}`

  // simResults is most-recent-first; take the last 5 played and reverse so
  // the oldest of the batch renders first (left to right).
  const lastFive = simResults.slice(0, 5).slice().reverse()
  const recentForm: FormPill[] = lastFive.map((r) => ({
    label: r.won ? 'W' : 'L',
    bg: r.won ? COLORS.winGreen : '#2A2A26',
    color: r.won ? 'white' : '#767672'
  }))

  const tonightBlurb =
    simResults.length > 0
      ? `${simResults[0].won ? 'W' : 'L'} ${simResults[0].myPts}–${simResults[0].oppPts} vs ${simResults[0].opp} · last sim'd`
      : 'Ready to simulate · press SIM DAY to begin'

  if (seasonPhase !== 'regular') {
    const isPlayoffs = seasonPhase === 'playoffs'
    const label = isPlayoffs ? 'PLAYOFFS' : 'OFFSEASON'
    const blurb = isPlayoffs ? 'Series in progress' : 'Draft & free agency'
    const target = isPlayoffs ? 'playoffs' : 'offseason'
    const btnLabel = isPlayoffs ? 'View Bracket →' : 'Go to Offseason Hub →'
    return (
      <div style={{ background: COLORS.contextDark, borderBottom: '1px solid #242420', flexShrink: 0 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              background: COLORS.accent,
              padding: '2px 8px',
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 10,
              color: 'white',
              letterSpacing: 1.5,
              flexShrink: 0
            }}
          >
            {label}
          </div>
          <span style={{ fontFamily: FONTS.body, fontSize: 12, color: 'white', fontWeight: 500 }}>{blurb}</span>
          <button
            onClick={() => goToPage(target)}
            className="hover-dim"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid #3A3A36',
              color: COLORS.accent,
              cursor: 'pointer',
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: 1,
              padding: '4px 10px',
              textTransform: 'uppercase'
            }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: COLORS.contextDark, borderBottom: '1px solid #242420', flexShrink: 0 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9,
            color: '#4A4A46',
            letterSpacing: 2,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          Season {seasonNumber} &middot; Day {simDay}/{gamesPerSeason} &middot; {simDateStr}
        </span>
        <div style={{ width: 1, height: 12, background: '#2A2A27', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            style={{
              background: COLORS.accent,
              padding: '2px 6px',
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: 9,
              color: 'white',
              letterSpacing: 1.5,
              flexShrink: 0
            }}
          >
            TONIGHT
          </div>
          <span style={{ fontFamily: FONTS.body, fontSize: 12, color: 'white', fontWeight: 500 }}>{tonightBlurb}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: '#4A4A46', letterSpacing: 2, marginRight: 2 }}>
            L5
          </span>
          {recentForm.map((r, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 2,
                background: r.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 11,
                color: r.color
              }}
            >
              {r.label}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - recentForm.length) }).map((_, i) => (
            <div
              key={`ph-${i}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 2,
                background: '#1E1E1B',
                opacity: 0.5
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
