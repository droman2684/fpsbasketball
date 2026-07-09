import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'
import type { BoxScorePlayerLine } from '@shared/types'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const PLAYER_GRID = '1fr 44px 40px 40px 40px 40px 40px 60px 60px 60px 50px'

function ptsColor(pts: number): string {
  return pts >= 20 ? COLORS.ovrA : pts >= 10 ? COLORS.textPrimary : COLORS.textMuted
}

function pmColor(pm: string): string {
  const n = parseInt(pm, 10)
  if (n > 0) return 'oklch(0.45 0.18 140)'
  if (n < 0) return COLORS.lossRed
  return COLORS.textMuted
}

function PlayerTable({
  teamName,
  headerBg,
  headerColor,
  players
}: {
  teamName: string
  headerBg: string
  headerColor: string
  players: BoxScorePlayerLine[]
}): React.JSX.Element {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', background: headerBg }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 15,
            color: headerColor,
            letterSpacing: 2,
            textTransform: 'uppercase'
          }}
        >
          {teamName}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: PLAYER_GRID,
          padding: '6px 14px',
          background: COLORS.bg,
          borderBottom: `1px solid ${COLORS.border}`,
          fontFamily: FONTS.mono,
          fontSize: 8,
          color: COLORS.textFaint,
          gap: 2
        }}
      >
        <span>PLAYER</span>
        <span style={{ textAlign: 'center' }}>MIN</span>
        <span style={{ textAlign: 'center' }}>PTS</span>
        <span style={{ textAlign: 'center' }}>REB</span>
        <span style={{ textAlign: 'center' }}>AST</span>
        <span style={{ textAlign: 'center' }}>STL</span>
        <span style={{ textAlign: 'center' }}>BLK</span>
        <span style={{ textAlign: 'right' }}>FG</span>
        <span style={{ textAlign: 'right' }}>3P</span>
        <span style={{ textAlign: 'right' }}>FT</span>
        <span style={{ textAlign: 'right' }}>+/-</span>
      </div>
      {players.map((p, i) => (
        <div
          key={p.id ?? `${p.name}-${i}`}
          className="hover-row"
          style={{
            display: 'grid',
            gridTemplateColumns: PLAYER_GRID,
            padding: '7px 14px',
            borderBottom: `1px solid ${COLORS.bg}`,
            gap: 2,
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginLeft: 6 }}>{p.pos}</span>
          </div>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.min}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: ptsColor(p.pts), textAlign: 'center' }}>
            {p.pts}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.reb}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.ast}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.stl}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{p.blk}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>{p.fgStr}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>{p.threeStr}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>{p.ftStr}</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: pmColor(p.pm), textAlign: 'right' }}>
            {p.pm}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AllStarGame(): React.JSX.Element {
  const allStarResult = useGameStore((s) => s.allStarResult)
  const allStarMvp = useGameStore((s) => s.allStarMvp)

  const leftName = allStarResult?.myName ?? 'Team A'
  const leftColor = allStarResult?.myColor ?? COLORS.accent

  return (
    <PageShell maxWidth={1200}>
      <PageHeader title="All-Star Game" />
      {!allStarResult ? (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, padding: 48, textAlign: 'center' }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.textFaint, fontWeight: 700, marginBottom: 8 }}>
            NO ALL-STAR GAME YET
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: '#C0BEB9' }}>
            The All-Star Game hasn&apos;t happened yet — keep simulating to reach the break.
          </p>
        </div>
      ) : (
        <>
          {allStarMvp ? (
            <div
              style={{
                background: COLORS.accentLight,
                border: `1px solid ${COLORS.accent}`,
                padding: '10px 16px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: 11,
                  color: COLORS.accent,
                  letterSpacing: 2,
                  textTransform: 'uppercase'
                }}
              >
                Game MVP
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{allStarMvp}</span>
            </div>
          ) : null}

          <div style={{ background: COLORS.sidebarDark, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div style={{ flex: 1, padding: 24, textAlign: 'center', borderRight: '1px solid #2A2A27' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#5A5A56', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                  {leftName}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 72,
                    color: allStarResult.won ? COLORS.accent : 'white',
                    lineHeight: 1
                  }}
                >
                  {allStarResult.myPts}
                </div>
              </div>
              <div
                style={{
                  flex: '0 0 180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                }}
              >
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>
                  FINAL
                </div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 22,
                    color: '#AEACA8',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  Exhibition
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', letterSpacing: 1 }}>{allStarResult.dateStr}</div>
              </div>
              <div style={{ flex: 1, padding: 24, textAlign: 'center', borderLeft: '1px solid #2A2A27' }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#5A5A56', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>
                  {allStarResult.oppName}
                </div>
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 72, color: '#5A5A56', lineHeight: 1 }}>
                  {allStarResult.oppPts}
                </div>
              </div>
            </div>
            <div
              style={{
                background: COLORS.contextDark,
                padding: '10px 28px',
                borderTop: '1px solid #242420',
                display: 'grid',
                gridTemplateColumns: '130px 70px 70px 70px 70px 90px',
                alignItems: 'center',
                rowGap: 6
              }}
            >
              <span />
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', textAlign: 'center' }}>Q1</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', textAlign: 'center' }}>Q2</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', textAlign: 'center' }}>Q3</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', textAlign: 'center' }}>Q4</span>
              <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#4A4A46', textAlign: 'right' }}>TOTAL</span>
              <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14, color: 'white' }}>{leftName}</span>
              {[allStarResult.q1l, allStarResult.q2l, allStarResult.q3l, allStarResult.q4l, allStarResult.myPts].map((v, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 15,
                    fontWeight: 500,
                    color: i === 4 ? (allStarResult.won ? COLORS.accent : 'white') : 'white',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  {v}
                </span>
              ))}
              <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 14, color: '#5A5A56' }}>{allStarResult.oppName}</span>
              {[allStarResult.q1o, allStarResult.q2o, allStarResult.q3o, allStarResult.q4o, allStarResult.oppPts].map((v, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 15,
                    color: i === 4 ? (allStarResult.won ? '#4A4A46' : COLORS.accent) : '#5A5A56',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
          <PlayerTable teamName={leftName} headerBg={leftColor} headerColor={getTextColor(leftColor)} players={allStarResult.myPlayers} />
          <PlayerTable
            teamName={allStarResult.oppName}
            headerBg={allStarResult.oppColor}
            headerColor={getTextColor(allStarResult.oppColor)}
            players={allStarResult.oppPlayers}
          />
        </>
      )}
    </PageShell>
  )
}
