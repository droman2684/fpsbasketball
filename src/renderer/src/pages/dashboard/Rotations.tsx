import { useState } from 'react'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS, ovrColor } from '@renderer/styles/theme'
import type { RosterPlayer } from '@shared/types'

const ROTATION_SIZE = 4

export default function Rotations(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const lineup = useGameStore((s) => s.lineup)
  const swapStarter = useGameStore((s) => s.swapStarter)
  const moveBenchPlayer = useGameStore((s) => s.moveBenchPlayer)

  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null)

  const byId = (id: number): RosterPlayer | undefined => myRoster.find((p) => p.id === id)

  const starters = lineup.starters.map((id, slotIndex) => ({ slotIndex, id, player: byId(id) }))
  const bench = lineup.bench.map((id, idx) => ({ idx, id, player: byId(id) })).filter((b) => !!b.player)

  const hasSelection = selectedBenchId !== null

  function handleBenchClick(id: number): void {
    setSelectedBenchId((cur) => (cur === id ? null : id))
  }

  function handleStarterClick(slotIndex: number): void {
    if (selectedBenchId === null) return
    swapStarter(slotIndex, selectedBenchId)
    setSelectedBenchId(null)
  }

  return (
    <PageShell maxWidth={1100}>
      <PageHeader
        title="Rotations"
        subtitle={
          hasSelection
            ? 'Select a starter slot to slot this player in.'
            : 'Click a bench player, then click a starter slot to swap them in.'
        }
      />

      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textFaint,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          Starting Five
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {starters.map(({ slotIndex, id, player }) => {
            if (!player) return null
            const clickable = hasSelection
            return (
              <div
                key={id}
                onClick={() => handleStarterClick(slotIndex)}
                className={clickable ? 'hover-fade' : undefined}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${clickable ? COLORS.accent : COLORS.border}`,
                  padding: 16,
                  textAlign: 'center',
                  cursor: clickable ? 'pointer' : 'default',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.textFaint,
                    letterSpacing: 2,
                    marginBottom: 4,
                    textTransform: 'uppercase'
                  }}
                >
                  {player.pos}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 900,
                    fontSize: 18,
                    color: ovrColor(player.ovr),
                    lineHeight: 1,
                    marginBottom: 2
                  }}
                >
                  {player.ovr}
                </div>
                <div style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>
                  {player.name}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint, marginTop: 4 }}>
                  {player.pts}/{player.reb}/{player.ast}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.textFaint,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          Bench
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          {bench.map(({ idx, id, player }, i) => {
            if (!player) return null
            const selected = selectedBenchId === id
            const isFirstReserve = i === ROTATION_SIZE
            return (
              <div key={id}>
                {i === 0 ? (
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.textFaint,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      padding: '8px 14px 6px',
                      background: COLORS.bg
                    }}
                  >
                    Rotation
                  </div>
                ) : null}
                {isFirstReserve ? (
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      color: COLORS.textFaint,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      padding: '8px 14px 6px',
                      background: COLORS.bg,
                      borderTop: `1px solid ${COLORS.border}`
                    }}
                  >
                    Reserve
                  </div>
                ) : null}
                <div
                  onClick={() => handleBenchClick(id)}
                  className={selected ? undefined : 'hover-row'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 14px',
                    borderBottom: `1px solid ${COLORS.bg}`,
                    background: selected ? COLORS.accentLight : COLORS.surface,
                    borderLeft: selected ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 11,
                      color: COLORS.textFaint,
                      width: 18,
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.display,
                      fontWeight: 900,
                      fontSize: 16,
                      color: ovrColor(player.ovr),
                      width: 28,
                      textAlign: 'center',
                      flexShrink: 0
                    }}
                  >
                    {player.ovr}
                  </div>
                  <div style={{ width: 30, flexShrink: 0, fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
                    {player.pos}
                  </div>
                  <div style={{ flex: 1, fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                    {player.name}
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, width: 90, textAlign: 'right' }}>
                    {player.pts}/{player.reb}/{player.ast}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveBenchPlayer(id, 'up')}
                      disabled={idx === 0}
                      className="hover-fade"
                      style={{
                        width: 20,
                        height: 20,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surface,
                        color: idx === 0 ? COLORS.textFaint : COLORS.textPrimary,
                        cursor: idx === 0 ? 'default' : 'pointer',
                        opacity: idx === 0 ? 0.4 : 1,
                        fontSize: 10,
                        lineHeight: 1,
                        padding: 0
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBenchPlayer(id, 'down')}
                      disabled={idx === bench.length - 1}
                      className="hover-fade"
                      style={{
                        width: 20,
                        height: 20,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.surface,
                        color: idx === bench.length - 1 ? COLORS.textFaint : COLORS.textPrimary,
                        cursor: idx === bench.length - 1 ? 'default' : 'pointer',
                        opacity: idx === bench.length - 1 ? 0.4 : 1,
                        fontSize: 10,
                        lineHeight: 1,
                        padding: 0
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
