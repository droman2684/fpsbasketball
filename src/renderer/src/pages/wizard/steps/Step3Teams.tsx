import { NBA_TEAMS } from '@renderer/data/teams'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'
import { useWizardStore } from '@renderer/state/wizardStore'

interface TeamTile {
  abbr: string
  name: string
  city: string
  primary: string
  textColor: string
  selected: boolean
  custom: boolean
}

export default function Step3Teams(): React.JSX.Element {
  const selectedTeams = useWizardStore((s) => s.selectedTeams)
  const fictionalTeams = useWizardStore((s) => s.fictionalTeams)
  const teamSearch = useWizardStore((s) => s.teamSearch)
  const showAddFictional = useWizardStore((s) => s.showAddFictional)
  const newTeam = useWizardStore((s) => s.newTeam)
  const setTeamSearch = useWizardStore((s) => s.setTeamSearch)
  const toggleTeam = useWizardStore((s) => s.toggleTeam)
  const selectAll = useWizardStore((s) => s.selectAll)
  const deselectAll = useWizardStore((s) => s.deselectAll)
  const toggleAddFictional = useWizardStore((s) => s.toggleAddFictional)
  const setNewTeamField = useWizardStore((s) => s.setNewTeamField)
  const addFictionalTeam = useWizardStore((s) => s.addFictionalTeam)

  const search = teamSearch.toLowerCase()

  const allTeams: TeamTile[] = [
    ...NBA_TEAMS.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      city: t.city,
      primary: t.primary,
      textColor: getTextColor(t.primary),
      selected: selectedTeams.includes(t.abbr),
      custom: false
    })),
    ...fictionalTeams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      city: t.city,
      primary: t.primary,
      textColor: getTextColor(t.primary),
      selected: true,
      custom: true
    }))
  ]

  const filteredTeams = search
    ? allTeams.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.abbr.toLowerCase().includes(search) ||
          t.city.toLowerCase().includes(search)
      )
    : allTeams

  const selectedCount = selectedTeams.length + fictionalTeams.length
  const totalTeams = NBA_TEAMS.length + fictionalTeams.length

  return (
    <div className="step-in">
      <div style={{ marginBottom: 32 }}>
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
          Step 3 of 6
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
          Select Teams
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.5, maxWidth: 440 }}>
          Choose which teams will compete in your league.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          placeholder="Search teams…"
          style={{
            flex: '0 0 190px',
            padding: '9px 13px',
            fontSize: 14,
            background: 'white',
            border: `1.5px solid ${COLORS.border}`,
            outline: 'none',
            color: COLORS.textPrimary,
            fontFamily: FONTS.body
          }}
        />
        <button
          onClick={selectAll}
          style={{
            padding: '9px 14px',
            background: 'white',
            color: COLORS.textPrimary,
            border: `1.5px solid ${COLORS.border}`,
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 1,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          All
        </button>
        <button
          onClick={deselectAll}
          style={{
            padding: '9px 14px',
            background: 'white',
            color: COLORS.textPrimary,
            border: `1.5px solid ${COLORS.border}`,
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 1,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          None
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 30,
              fontWeight: 900,
              color: COLORS.textPrimary,
              lineHeight: 1
            }}
          >
            {selectedCount}
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>
            / {totalTeams} teams
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 7,
          marginBottom: 28
        }}
      >
        {filteredTeams.map((team) => (
          <div
            key={team.abbr}
            onClick={() => toggleTeam(team.abbr)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              border: `2.5px solid ${team.selected ? COLORS.accent : 'transparent'}`,
              opacity: team.selected ? 1 : 0.38
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
            {team.selected ? (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  color: COLORS.accent,
                  lineHeight: 1
                }}
              >
                ✓
              </div>
            ) : null}
            {team.custom ? (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  background: 'rgba(0,0,0,0.55)',
                  color: 'white',
                  fontFamily: FONTS.mono,
                  fontSize: 7,
                  padding: '2px 4px',
                  letterSpacing: 0.5,
                  fontWeight: 500
                }}
              >
                CUSTOM
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 22, marginBottom: 6 }}>
        <button
          onClick={toggleAddFictional}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: '1.5px dashed #C0BEB9',
            color: COLORS.textMuted,
            padding: '11px 18px',
            fontFamily: FONTS.display,
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          + ADD CUSTOM TEAM
        </button>
      </div>

      {showAddFictional ? (
        <div
          style={{
            background: 'white',
            border: `1.5px solid ${COLORS.border}`,
            padding: 26,
            maxWidth: 520,
            marginTop: 14
          }}
        >
          <h3
            style={{
              fontFamily: FONTS.display,
              fontWeight: 900,
              fontSize: 20,
              color: COLORS.textPrimary,
              marginBottom: 18,
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}
          >
            New Custom Team
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                City
              </label>
              <input
                type="text"
                value={newTeam.city}
                onChange={(e) => setNewTeamField('city', e.target.value)}
                placeholder="Las Vegas"
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  background: COLORS.bg,
                  border: `1.5px solid ${COLORS.border}`,
                  outline: 'none',
                  fontFamily: FONTS.body
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                Team Name
              </label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeamField('name', e.target.value)}
                placeholder="Eagles"
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  background: COLORS.bg,
                  border: `1.5px solid ${COLORS.border}`,
                  outline: 'none',
                  fontFamily: FONTS.body
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 1fr',
              gap: 14,
              alignItems: 'end',
              marginBottom: 20
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                Abbr.
              </label>
              <input
                type="text"
                value={newTeam.abbr}
                onChange={(e) => setNewTeamField('abbr', e.target.value)}
                maxLength={3}
                placeholder="LVE"
                style={{
                  width: '100%',
                  padding: '10px 13px',
                  fontSize: 16,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  background: COLORS.bg,
                  border: `1.5px solid ${COLORS.border}`,
                  outline: 'none',
                  fontFamily: FONTS.display,
                  letterSpacing: 2,
                  textTransform: 'uppercase'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                Primary Color
              </label>
              <input
                type="color"
                value={newTeam.primary}
                onChange={(e) => setNewTeamField('primary', e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  border: `1.5px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  padding: 3,
                  background: 'white'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: COLORS.textFaint,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                Secondary Color
              </label>
              <input
                type="color"
                value={newTeam.secondary}
                onChange={(e) => setNewTeamField('secondary', e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  border: `1.5px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  padding: 3,
                  background: 'white'
                }}
              />
            </div>
          </div>
          <button
            onClick={addFictionalTeam}
            style={{
              padding: '12px 26px',
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
            ADD TO LEAGUE
          </button>
        </div>
      ) : null}
    </div>
  )
}
