import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { pickLabel } from '@renderer/data/engine'
import { COLORS, FONTS, fmtMoney } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'
import type { DraftPickAsset } from '@shared/types'

interface TradeListPlayer {
  id: number
  name: string
  pos: string
  ovr: number
  salaryFmt: string
}

function TradeRow({
  player,
  selected,
  onClick
}: {
  player: TradeListPlayer
  selected: boolean
  onClick: () => void
}): React.JSX.Element {
  const selBorder = selected ? COLORS.accent : COLORS.border
  const selBg = selected ? 'oklch(0.97 0.015 42)' : COLORS.surface
  const chkBg = selected ? COLORS.accent : COLORS.surface
  return (
    <div
      onClick={onClick}
      className="hover-fade"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 16px',
        borderBottom: `1px solid ${COLORS.bg}`,
        cursor: 'pointer',
        background: selBg,
        borderLeft: `3px solid ${selBorder}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div
          style={{
            width: 18,
            height: 18,
            border: `1.5px solid ${selBorder}`,
            background: chkBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {selected ? (
            <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 12, color: 'white', lineHeight: 1 }}>✓</span>
          ) : null}
        </div>
        <div>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{player.name}</div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textFaint }}>
            {player.pos} · OVR {player.ovr}
          </div>
        </div>
      </div>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>{player.salaryFmt}</span>
    </div>
  )
}

function TradePickRow({
  label,
  selected,
  onClick
}: {
  label: string
  selected: boolean
  onClick: () => void
}): React.JSX.Element {
  const selBorder = selected ? COLORS.accent : COLORS.border
  const selBg = selected ? 'oklch(0.97 0.015 42)' : COLORS.surface
  const chkBg = selected ? COLORS.accent : COLORS.surface
  return (
    <div
      onClick={onClick}
      className="hover-fade"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 16px',
        borderBottom: `1px solid ${COLORS.bg}`,
        cursor: 'pointer',
        background: selBg,
        borderLeft: `3px solid ${selBorder}`
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          border: `1.5px solid ${selBorder}`,
          background: chkBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {selected ? (
          <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 12, color: 'white', lineHeight: 1 }}>✓</span>
        ) : null}
      </div>
      <span style={{ fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{label}</span>
    </div>
  )
}

function PickSectionLabel({ text }: { text: string }): React.JSX.Element {
  return (
    <div
      style={{
        padding: '6px 16px',
        background: COLORS.bg,
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: COLORS.textFaint,
        letterSpacing: 1
      }}
    >
      {text}
    </div>
  )
}

export default function Trades(): React.JSX.Element {
  const myRoster = useGameStore((s) => s.myRoster)
  const myTeam = useGameStore((s) => s.myTeam)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const rosters = useGameStore((s) => s.rosters)
  const tradeTeam = useGameStore((s) => s.tradeTeam)
  const setTradeTeam = useGameStore((s) => s.setTradeTeam)
  const tradeMyPicks = useGameStore((s) => s.tradeMyPicks)
  const tradeTheirPicks = useGameStore((s) => s.tradeTheirPicks)
  const toggleMyTradePick = useGameStore((s) => s.toggleMyTradePick)
  const toggleTheirTradePick = useGameStore((s) => s.toggleTheirTradePick)
  const draftPickAssets = useGameStore((s) => s.draftPickAssets)
  const draftYear = useGameStore((s) => s.draftYear)
  const draftPhase = useGameStore((s) => s.draftPhase)
  const tradeMyPickAssets = useGameStore((s) => s.tradeMyPickAssets)
  const tradeTheirPickAssets = useGameStore((s) => s.tradeTheirPickAssets)
  const toggleMyTradePickAsset = useGameStore((s) => s.toggleMyTradePickAsset)
  const toggleTheirTradePickAsset = useGameStore((s) => s.toggleTheirTradePickAsset)
  const sendTrade = useGameStore((s) => s.sendTrade)
  const [rejection, setRejection] = useState<string | null>(null)

  const myTeamInfo = leagueTeams.find((t) => t.abbr === myTeam)
  const theirTeamInfo = leagueTeams.find((t) => t.abbr === tradeTeam)
  const tradeTeamOptions = leagueTeams.filter((t) => t.abbr !== myTeam)
  const theirRoster = rosters[tradeTeam] ?? []

  const isTradeablePick = (pick: DraftPickAsset): boolean => !(pick.year === draftYear && draftPhase === 'complete')
  const myPicks = draftPickAssets.filter((a) => a.currentOwner === myTeam && isTradeablePick(a))
  const theirPicks = draftPickAssets.filter((a) => a.currentOwner === tradeTeam && isTradeablePick(a))

  const myNames = tradeMyPicks.map((id) => myRoster.find((p) => p.id === id)?.name).filter((n): n is string => !!n)
  const theirNames = tradeTheirPicks.map((id) => theirRoster.find((p) => p.id === id)?.name).filter((n): n is string => !!n)
  const myPickLabels = tradeMyPickAssets
    .map((id) => draftPickAssets.find((a) => a.id === id))
    .filter((a): a is DraftPickAsset => !!a)
    .map((a) => pickLabel(a, leagueTeams))
  const theirPickLabels = tradeTheirPickAssets
    .map((id) => draftPickAssets.find((a) => a.id === id))
    .filter((a): a is DraftPickAsset => !!a)
    .map((a) => pickLabel(a, leagueTeams))
  const myItems = [...myNames, ...myPickLabels]
  const theirItems = [...theirNames, ...theirPickLabels]
  const tradeSummary =
    myItems.length && theirItems.length
      ? `${myTeam} sends ${myItems.join(', ')} → ${tradeTeam} sends ${theirItems.join(', ')}`
      : 'Select players or picks on both sides to build a trade offer'

  const handleToggleMy = (id: number): void => {
    setRejection(null)
    toggleMyTradePick(id)
  }
  const handleToggleTheir = (id: number): void => {
    setRejection(null)
    toggleTheirTradePick(id)
  }
  const handleToggleMyPick = (id: string): void => {
    setRejection(null)
    toggleMyTradePickAsset(id)
  }
  const handleToggleTheirPick = (id: string): void => {
    setRejection(null)
    toggleTheirTradePickAsset(id)
  }
  const handleSend = (): void => {
    const hadSelection =
      (tradeMyPicks.length > 0 || tradeMyPickAssets.length > 0) && (tradeTheirPicks.length > 0 || tradeTheirPickAssets.length > 0)
    const ok = sendTrade()
    if (!ok && hadSelection) {
      setRejection(`${theirTeamInfo ? `${theirTeamInfo.city} ${theirTeamInfo.name}` : tradeTeam} rejected the offer — not enough value`)
    } else if (ok) {
      setRejection(null)
    }
  }

  return (
    <PageShell maxWidth={1280}>
      <PageHeader title="Trade Center" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* My team */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.sidebarDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: myTeamInfo?.primary ?? '#141412',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 8, color: myTeamInfo?.secondary ?? 'white' }}>
                  {myTeam}
                </span>
              </div>
              <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 15, color: 'white', letterSpacing: 1 }}>
                YOUR OFFER
              </span>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#5A5A56', letterSpacing: 1 }}>
              {tradeMyPicks.length} player(s), {tradeMyPickAssets.length} pick(s) selected
            </span>
          </div>
          {myRoster.map((p) => (
            <TradeRow
              key={p.id}
              player={{ id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, salaryFmt: fmtMoney(p.salary) }}
              selected={tradeMyPicks.includes(p.id)}
              onClick={() => handleToggleMy(p.id)}
            />
          ))}
          {myPicks.length > 0 ? (
            <>
              <PickSectionLabel text="DRAFT PICKS" />
              {myPicks.map((pick) => (
                <TradePickRow
                  key={pick.id}
                  label={pickLabel(pick, leagueTeams)}
                  selected={tradeMyPickAssets.includes(pick.id)}
                  onClick={() => handleToggleMyPick(pick.id)}
                />
              ))}
            </>
          ) : null}
        </div>
        {/* Their team */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.sidebarDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: theirTeamInfo?.primary ?? '#141412',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 8, color: 'white' }}>{tradeTeam}</span>
              </div>
              <select
                value={tradeTeam}
                onChange={(e) => {
                  setRejection(null)
                  setTradeTeam(e.target.value)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: 15,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {tradeTeamOptions.map((opt) => (
                  <option key={opt.abbr} value={opt.abbr}>
                    {opt.city} {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#5A5A56', letterSpacing: 1 }}>
              {tradeTheirPicks.length} player(s), {tradeTheirPickAssets.length} pick(s) selected
            </span>
          </div>
          {theirRoster.map((p) => (
            <TradeRow
              key={p.id}
              player={{ id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, salaryFmt: fmtMoney(p.salary) }}
              selected={tradeTheirPicks.includes(p.id)}
              onClick={() => handleToggleTheir(p.id)}
            />
          ))}
          {theirPicks.length > 0 ? (
            <>
              <PickSectionLabel text="DRAFT PICKS" />
              {theirPicks.map((pick) => (
                <TradePickRow
                  key={pick.id}
                  label={pickLabel(pick, leagueTeams)}
                  selected={tradeTheirPickAssets.includes(pick.id)}
                  onClick={() => handleToggleTheirPick(pick.id)}
                />
              ))}
            </>
          ) : null}
        </div>
      </div>
      {/* Trade summary bar */}
      <div
        style={{
          background: COLORS.sidebarDark,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.textMuted }}>
          Trade Summary: <span style={{ color: 'white', fontWeight: 600 }}>{tradeSummary}</span>
          {rejection ? (
            <div style={{ marginTop: 4, fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent }}>{rejection}</div>
          ) : null}
        </div>
        <button
          onClick={handleSend}
          className="hover-dim"
          style={{
            padding: '10px 28px',
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
          SEND TRADE OFFER
        </button>
      </div>
    </PageShell>
  )
}
