import { useEffect } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import type { DraftPhase } from '@shared/types'

const PHASE_LABEL: Record<DraftPhase, string> = {
  off: 'Pre-Draft',
  lottery: 'Lottery',
  lotteryReveal: 'Lottery',
  board: 'On The Clock',
  complete: 'Draft Complete'
}

const LOTTERY_ODDS = [14.0, 13.4, 12.7, 12.0, 10.5, 9.0, 7.5, 6.0, 4.5, 3.0, 2.0, 1.5, 1.0, 0.5]

function potColor(potential: string): string {
  if (potential.startsWith('A')) return 'oklch(0.45 0.18 140)'
  if (potential.startsWith('B')) return COLORS.ovrB
  return COLORS.textMuted
}

export default function DraftRoom(): React.JSX.Element {
  const goHome = useGameStore((s) => s.goHome)
  const draftPhase = useGameStore((s) => s.draftPhase)
  const draftProspects = useGameStore((s) => s.draftProspects)
  const draftPicks = useGameStore((s) => s.draftPicks)
  const draftFullOrder = useGameStore((s) => s.draftFullOrder)
  const draftSlotOwners = useGameStore((s) => s.draftSlotOwners)
  const draftCurrentPick = useGameStore((s) => s.draftCurrentPick)
  const myTeam = useGameStore((s) => s.myTeam)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const records = useGameStore((s) => s.records)
  const simDate = useGameStore((s) => s.simDate)
  const initDraft = useGameStore((s) => s.initDraft)
  const runLottery = useGameStore((s) => s.runLottery)
  const draftPlayer = useGameStore((s) => s.draftPlayer)
  const lotteryRevealOrder = useGameStore((s) => s.lotteryRevealOrder)
  const lotteryRevealedCount = useGameStore((s) => s.lotteryRevealedCount)
  const revealNextLotteryPick = useGameStore((s) => s.revealNextLotteryPick)
  const skipLotteryReveal = useGameStore((s) => s.skipLotteryReveal)

  const teamByAbbr = new Map(leagueTeams.map((t) => [t.abbr, t]))
  const myTeamObj = teamByAbbr.get(myTeam)

  useEffect(() => {
    if (draftPhase !== 'lotteryReveal') return
    const total = lotteryRevealOrder?.length ?? 0
    if (lotteryRevealedCount >= total) return
    const timer = setInterval(() => {
      revealNextLotteryPick()
    }, 1800)
    return () => clearInterval(timer)
  }, [draftPhase, lotteryRevealedCount, lotteryRevealOrder, revealNextLotteryPick])

  return (
    <PageShell maxWidth={1380}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <button
            onClick={goHome}
            className="hover-muted"
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textFaint,
              cursor: 'pointer',
              fontSize: 12,
              padding: '0 0 6px',
              fontFamily: FONTS.body
            }}
          >
            ← Dashboard
          </button>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 42,
              color: COLORS.textPrimary,
              letterSpacing: -1,
              lineHeight: 1
            }}
          >
            Draft Room
          </h1>
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.accent,
            letterSpacing: 2,
            textTransform: 'uppercase',
            paddingBottom: 6
          }}
        >
          {PHASE_LABEL[draftPhase]}
        </div>
      </div>

      {draftPhase === 'off' && (
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            padding: 56,
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto'
          }}
        >
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 32, color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 8 }}>
            {simDate.y + 1} DRAFT
          </div>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
            60 prospects across 2 rounds. Begin with the lottery to set pick order for non-playoff teams.
          </p>
          <button
            onClick={initDraft}
            className="hover-dim"
            style={{
              padding: '16px 48px',
              background: COLORS.accent,
              color: 'white',
              border: 'none',
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 3,
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            OPEN DRAFT LOBBY
          </button>
        </div>
      )}

      {draftPhase === 'lottery' &&
        (() => {
          const byRecord = [...leagueTeams].sort((a, b) => {
            const ra = records[a.abbr] ?? { w: 0, l: 0 }
            const rb = records[b.abbr] ?? { w: 0, l: 0 }
            return ra.w - rb.w || rb.l - ra.l
          })
          const sliceLen = Math.min(byRecord.length, LOTTERY_ODDS.length)
          const lotteryTeams = byRecord.slice(0, sliceLen).map((t, i) => {
            const r = records[t.abbr] ?? { w: 0, l: 0 }
            const mine = t.abbr === myTeam
            return {
              ...t,
              w: r.w,
              l: r.l,
              rank: i + 1,
              odds: LOTTERY_ODDS[i] + '%',
              rankColor: mine ? COLORS.accent : COLORS.textFaint,
              rowBg: mine ? 'oklch(0.99 0.008 42)' : COLORS.surface,
              fw: mine ? 700 : 400
            }
          })
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.sidebarDark }}>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
                    LOTTERY TEAMS · {sliceLen} Picks
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 52px 52px 80px',
                    padding: '6px 16px',
                    background: COLORS.bg,
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.mono,
                    fontSize: 8,
                    color: COLORS.textFaint,
                    gap: 4
                  }}
                >
                  <span>#</span>
                  <span>TEAM</span>
                  <span style={{ textAlign: 'center' }}>W</span>
                  <span style={{ textAlign: 'center' }}>L</span>
                  <span style={{ textAlign: 'right' }}>ODDS</span>
                </div>
                {lotteryTeams.map((t) => (
                  <div
                    key={t.abbr}
                    className="hover-fade"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr 52px 52px 80px',
                      padding: '9px 16px',
                      borderBottom: `1px solid ${COLORS.bg}`,
                      background: t.rowBg,
                      gap: 4,
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: t.rankColor, fontWeight: 600 }}>{t.rank}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.primary }} />
                      <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: t.fw, color: COLORS.textPrimary }}>{t.city}</span>
                    </div>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{t.w}</span>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }}>{t.l}</span>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, textAlign: 'right' }}>
                      {t.odds}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: COLORS.textPrimary, marginBottom: 8 }}>
                  DRAFT LOTTERY
                </div>
                <p style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
                  Weighted lottery determines picks 1–4. Remaining lottery teams follow in reverse standings order.
                </p>
                <button
                  onClick={runLottery}
                  className="hover-dim"
                  style={{
                    padding: '16px 36px',
                    background: COLORS.accent,
                    color: 'white',
                    border: 'none',
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  RUN LOTTERY →
                </button>
              </div>
            </div>
          )
        })()}

      {draftPhase === 'lotteryReveal' &&
        (() => {
          const order = lotteryRevealOrder ?? []
          const total = order.length
          const revealedCount = Math.min(lotteryRevealedCount, total)
          const latestIndex = revealedCount - 1
          const latestAbbr = latestIndex >= 0 ? order[latestIndex] : null
          const latestTeam = latestAbbr ? teamByAbbr.get(latestAbbr) : null
          const latestPickNum = total - revealedCount + 1
          const nextPickNum = total - revealedCount
          const isLatestMine = !!latestAbbr && latestAbbr === myTeam

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                <div style={{ padding: '12px 18px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.sidebarDark }}>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
                    LOTTERY RESULTS
                  </span>
                </div>
                {order.map((abbr, i) => {
                  const pickNum = total - i
                  const revealed = i < revealedCount
                  const team = teamByAbbr.get(abbr)
                  const mine = abbr === myTeam
                  const isLatest = revealed && i === latestIndex
                  return (
                    <div
                      key={`${abbr}-${i}`}
                      className={isLatest ? 'pg' : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        borderBottom: `1px solid ${COLORS.bg}`,
                        background: revealed && mine ? 'oklch(0.97 0.03 42)' : COLORS.surface,
                        borderLeft: revealed && mine ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                        opacity: revealed ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.display,
                          fontWeight: 900,
                          fontSize: 18,
                          color: revealed ? (mine ? COLORS.accent : COLORS.textPrimary) : COLORS.textFaint,
                          width: 30,
                          flexShrink: 0
                        }}
                      >
                        {pickNum}
                      </span>
                      {revealed && team ? (
                        <>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.primary, flexShrink: 0 }} />
                          <span style={{ fontFamily: FONTS.body, fontSize: 14, fontWeight: mine ? 700 : 500, color: COLORS.textPrimary }}>
                            {team.city} {team.name}
                          </span>
                          {mine && (
                            <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontSize: 8, color: COLORS.accent, letterSpacing: 1 }}>
                              YOUR PICK
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textFaint, letterSpacing: 3 }}>? ? ?</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div
                style={{
                  background: COLORS.sidebarDark,
                  border: `1px solid ${COLORS.border}`,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  minHeight: 380
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    color: COLORS.accent,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    marginBottom: 14
                  }}
                >
                  {latestTeam ? 'ON THE BOARD' : 'DRAFT LOTTERY LIVE'}
                </div>
                {latestTeam ? (
                  <div
                    key={`${latestAbbr}-${revealedCount}`}
                    className="pg"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: 'white', letterSpacing: 2, marginBottom: 16 }}>
                      PICK {latestPickNum}
                    </div>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: latestTeam.primary,
                        marginBottom: 16,
                        border: `2px solid ${latestTeam.secondary ?? '#FFFFFF'}`
                      }}
                    />
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 34, color: 'white', letterSpacing: -0.5, lineHeight: 1.05 }}>
                      {latestTeam.city}
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.display,
                        fontWeight: 900,
                        fontSize: 22,
                        color: 'oklch(0.75 0.05 42)',
                        letterSpacing: -0.5,
                        marginBottom: 10
                      }}
                    >
                      {latestTeam.name}
                    </div>
                    {isLatestMine && (
                      <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, letterSpacing: 2, marginTop: 4 }}>
                        ★ YOUR TEAM ★
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="lottery-pulse" style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 30, color: 'white', letterSpacing: 1 }}>
                    PICK {nextPickNum > 0 ? nextPickNum : total}…
                  </div>
                )}
                <button
                  onClick={skipLotteryReveal}
                  className="hover-dim"
                  style={{
                    marginTop: 30,
                    padding: '12px 28px',
                    background: 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.4)',
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  SKIP TO RESULTS →
                </button>
              </div>
            </div>
          )
        })()}

      {draftPhase === 'board' &&
        (() => {
          const isMyTurn = draftSlotOwners[draftCurrentPick] === myTeam
          const currentPickNum = draftCurrentPick + 1
          const roundSize = draftFullOrder.length / 2
          const draftCurrentRound = Math.floor(draftCurrentPick / roundSize) + 1
          const draftBoardPicks = draftFullOrder.map((originalTeam, i) => {
            const pick = draftPicks.find((p) => p.pickNum === i + 1)
            const team = draftSlotOwners[i]
            const isCur = i === draftCurrentPick
            const isMine = team === myTeam
            const teamObj = teamByAbbr.get(team)
            const wasTraded = team !== originalTeam
            const originalTeamObj = teamByAbbr.get(pick ? pick.originalTeam : originalTeam)
            return {
              pickNum: i + 1,
              team,
              teamCity: teamObj?.city ?? team,
              teamColor: teamObj?.primary ?? COLORS.textMuted,
              isCurrent: isCur,
              drafted: !!pick,
              prospectPos: pick?.prospect.pos ?? '',
              prospectOvr: pick?.prospect.ovr ?? 0,
              displayName: pick ? pick.prospect.name : teamObj?.city ?? team,
              nameFw: pick ? 600 : 400,
              rowBg: isCur ? 'oklch(0.99 0.012 42)' : isMine && !pick ? 'oklch(0.97 0.008 240)' : COLORS.surface,
              pickColor: isCur ? COLORS.accent : isMine ? COLORS.ovrB : COLORS.textFaint,
              nameColor: isCur || isMine ? COLORS.textPrimary : COLORS.textMuted,
              wasTraded,
              originalTeamCity: originalTeamObj?.city ?? (pick ? pick.originalTeam : originalTeam)
            }
          })
          const availableProspects = (draftProspects ?? [])
            .filter((p) => !p.drafted)
            .map((p) => ({ ...p, ovrColorVal: ovrColor(p.ovr), potColorVal: potColor(p.potential) }))

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  overflow: 'hidden',
                  maxHeight: 'calc(100vh - 220px)',
                  overflowY: 'auto'
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: `1px solid ${COLORS.border}`,
                    background: COLORS.sidebarDark,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}
                >
                  <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
                    DRAFT BOARD
                  </span>
                </div>
                {draftBoardPicks.map((pick) => (
                  <div
                    key={pick.pickNum}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderBottom: `1px solid ${COLORS.bg}`,
                      background: pick.rowBg
                    }}
                  >
                    <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 15, color: pick.pickColor, width: 26, flexShrink: 0 }}>
                      {pick.pickNum}
                    </span>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: pick.teamColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          fontWeight: pick.nameFw,
                          color: pick.nameColor,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {pick.displayName}
                      </div>
                      {pick.wasTraded && (
                        <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>
                          via {pick.originalTeamCity}
                        </div>
                      )}
                      {pick.drafted && (
                        <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.textFaint }}>
                          {pick.prospectPos} · {pick.prospectOvr}
                        </div>
                      )}
                      {pick.isCurrent && (
                        <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.accent, letterSpacing: 1 }}>ON THE CLOCK</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                {isMyTurn && (
                  <div
                    style={{
                      background: 'oklch(0.99 0.01 42)',
                      border: `1.5px solid ${COLORS.accent}`,
                      padding: '14px 18px',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: 'oklch(0.45 0.19 42)' }}>
                        {(myTeamObj?.name ?? myTeam).toUpperCase()} ON THE CLOCK · PICK {currentPickNum}
                      </div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.accent, marginTop: 2, letterSpacing: 1 }}>
                        Round {draftCurrentRound} — Click a prospect to draft
                      </div>
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: myTeamObj?.secondary ?? COLORS.textPrimary, letterSpacing: 1 }}>
                      {myTeam}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    overflow: 'hidden',
                    maxHeight: 'calc(100vh - 220px)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: COLORS.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: COLORS.textPrimary, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      Available Prospects
                    </span>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, letterSpacing: 1 }}>
                      {availableProspects.length} remaining
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 44px 40px 56px 60px 80px',
                      padding: '6px 14px',
                      background: COLORS.bg,
                      borderBottom: `1px solid ${COLORS.border}`,
                      fontFamily: FONTS.mono,
                      fontSize: 8,
                      color: COLORS.textFaint,
                      gap: 4
                    }}
                  >
                    <span>RK</span>
                    <span>PROSPECT</span>
                    <span style={{ textAlign: 'center' }}>POS</span>
                    <span style={{ textAlign: 'center' }}>AGE</span>
                    <span style={{ textAlign: 'center' }}>OVR</span>
                    <span style={{ textAlign: 'center' }}>POT</span>
                    <span />
                  </div>
                  <div style={{ overflowY: 'auto' }}>
                    {availableProspects.map((p) => (
                      <div
                        key={p.id}
                        className="hover-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '36px 1fr 44px 40px 56px 60px 80px',
                          padding: '9px 14px',
                          borderBottom: `1px solid ${COLORS.bg}`,
                          gap: 4,
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint }}>{p.rank}</span>
                        <div>
                          <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{p.name}</div>
                          <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
                            {p.origin} · {p.pts} PPG
                          </div>
                        </div>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.pos}</span>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, textAlign: 'center' }}>{p.age}</span>
                        <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: p.ovrColorVal, textAlign: 'center' }}>
                          {p.ovr}
                        </span>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, color: p.potColorVal, textAlign: 'center' }}>
                          {p.potential}
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {isMyTurn && (
                            <button
                              onClick={() => draftPlayer(p.id)}
                              className="hover-dim"
                              style={{
                                padding: '5px 12px',
                                background: COLORS.accent,
                                color: 'white',
                                border: 'none',
                                fontFamily: FONTS.display,
                                fontWeight: 900,
                                fontSize: 12,
                                letterSpacing: 1.5,
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              DRAFT
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

      {draftPhase === 'complete' &&
        (() => {
          const myPicks = draftPicks.filter((p) => p.team === myTeam)
          return (
            <>
              <div
                style={{
                  marginBottom: 14,
                  background: 'oklch(0.99 0.008 42)',
                  border: `1.5px solid ${COLORS.accent}`,
                  padding: '14px 20px'
                }}
              >
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: 'oklch(0.45 0.19 42)' }}>
                  DRAFT COMPLETE · {(myTeamObj?.name ?? myTeam).toUpperCase()} SELECTIONS
                </div>
              </div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                {myPicks.map((pick) => (
                  <div
                    key={pick.pickNum}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      borderBottom: `1px solid ${COLORS.bg}`
                    }}
                  >
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: COLORS.accent, width: 44, flexShrink: 0, lineHeight: 1 }}>
                      {pick.pickNum}
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, width: 48, flexShrink: 0, letterSpacing: 1 }}>
                      R{pick.round}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>{pick.prospect.name}</div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 2 }}>
                        {pick.prospect.pos} · Age {pick.prospect.age} · {pick.prospect.origin}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 28, color: ovrColor(pick.prospect.ovr) }}>
                        {pick.prospect.ovr}
                      </div>
                      <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.accent }}>{pick.prospect.potential}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        })()}
    </PageShell>
  )
}
