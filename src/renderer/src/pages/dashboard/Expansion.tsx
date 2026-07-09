import { useState } from 'react'
import { useGameStore } from '@renderer/state/gameStore'
import { COLORS, FONTS } from '@renderer/styles/theme'
import PageShell from '@renderer/components/dashboard/PageShell'
import PageHeader from '@renderer/components/dashboard/PageHeader'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: FONTS.mono,
  fontSize: 9,
  color: COLORS.textFaint,
  letterSpacing: 2,
  textTransform: 'uppercase',
  marginBottom: 7
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: COLORS.textPrimary,
  background: COLORS.bg,
  border: `1.5px solid ${COLORS.border}`,
  outline: 'none',
  fontFamily: FONTS.body
}

export default function Expansion(): React.JSX.Element {
  const expCity = useGameStore((s) => s.expCity)
  const expName = useGameStore((s) => s.expName)
  const expAbbr = useGameStore((s) => s.expAbbr)
  const expConf = useGameStore((s) => s.expConf)
  const expColor = useGameStore((s) => s.expColor)
  const setExpField = useGameStore((s) => s.setExpField)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const addExpansionTeam = useGameStore((s) => s.addExpansionTeam)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleAdd = (): void => {
    const abbr = expAbbr.trim().toUpperCase()
    if (!expCity.trim() || !expName.trim() || !abbr) {
      setMessage({ text: 'Blocked — fill in city, team name, and abbreviation', ok: false })
      return
    }
    if (leagueTeams.some((t) => t.abbr === abbr)) {
      setMessage({ text: `Blocked — abbreviation "${abbr}" is already taken`, ok: false })
      return
    }
    const ok = addExpansionTeam()
    if (ok) {
      setMessage({ text: 'Franchise added!', ok: true })
    } else {
      setMessage({ text: 'Blocked — could not add franchise', ok: false })
    }
  }

  return (
    <PageShell maxWidth={700}>
      <PageHeader title="Expansion Teams" subtitle="Add a new franchise to the league" />
      <div
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>City</label>
            <input
              type="text"
              value={expCity}
              onChange={(e) => setExpField('expCity', e.target.value)}
              placeholder="e.g. Las Vegas"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Team Name</label>
            <input
              type="text"
              value={expName}
              onChange={(e) => setExpField('expName', e.target.value)}
              placeholder="e.g. Aces"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Abbr.</label>
            <input
              type="text"
              value={expAbbr}
              onChange={(e) => setExpField('expAbbr', e.target.value)}
              maxLength={3}
              placeholder="LVA"
              style={{
                ...inputStyle,
                fontSize: 15,
                fontWeight: 800,
                fontFamily: FONTS.display,
                letterSpacing: 2,
                textTransform: 'uppercase'
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Conference</label>
            <select
              value={expConf}
              onChange={(e) => setExpField('expConf', e.target.value)}
              style={inputStyle}
            >
              <option value="East">Eastern</option>
              <option value="West">Western</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Primary Color</label>
            <input
              type="color"
              value={expColor}
              onChange={(e) => setExpField('expColor', e.target.value)}
              style={{
                width: '100%',
                height: 40,
                border: `1.5px solid ${COLORS.border}`,
                padding: 3,
                background: 'white',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="hover-dim"
          style={{
            padding: '13px 0',
            background: COLORS.accent,
            color: 'white',
            border: 'none',
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          ADD EXPANSION TEAM
        </button>
        {message ? (
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: 0.5,
              textAlign: 'center',
              color: message.ok ? 'oklch(0.45 0.18 140)' : '#B3261E'
            }}
          >
            {message.text}
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
