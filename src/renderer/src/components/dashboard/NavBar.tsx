import type { CSSProperties } from 'react'
import { useGameStore, type NavDropdown } from '@renderer/state/gameStore'
import { TEAM_DATA } from '@renderer/data/teams'
import { COLORS, FONTS, getTextColor } from '@renderer/styles/theme'

// Page-key groupings that decide which nav group is "active" (accent text +
// bottom border) for the current page. This routing metadata doesn't live in
// the store, so it's hardcoded here per the design handoff.
const GM_PAGES = ['roster', 'depthChart', 'trades', 'tradeOffers', 'freeAgency', 'waivers', 'salaryCap', 'contracts']
const COACH_PAGES = ['gamePlan', 'rotations', 'scouting', 'development', 'injuries']
const LEAGUE_PAGES = [
  'standings',
  'schedule',
  'calendar',
  'playerStats',
  'teamStats',
  'transactions',
  'boxScore',
  'allStarGame',
  'playoffs'
]
const COMM_PAGES = [
  'leagueRules',
  'salaryCapRules',
  'draftOrder',
  'expansion',
  'ruleChanges',
  'draft',
  'draftCombine',
  'prospectScouting',
  'offseason'
]

interface NavItem {
  label: string
  isSection: boolean
  page?: string
}
const sec = (label: string): NavItem => ({ label, isSection: true })
const it = (label: string, page: string): NavItem => ({ label, isSection: false, page })

interface NavGroupDef {
  key: Exclude<NavDropdown, null>
  label: string
  pages: string[]
  minWidth: number
  items: NavItem[]
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th'
  const last = n % 10
  if (last === 1) return 'st'
  if (last === 2) return 'nd'
  if (last === 3) return 'rd'
  return 'th'
}

export default function NavBar(): React.JSX.Element {
  const page = useGameStore((s) => s.page)
  const openDropdown = useGameStore((s) => s.openDropdown)
  const setOpenDropdown = useGameStore((s) => s.setOpenDropdown)
  const goToPage = useGameStore((s) => s.goToPage)
  const goHome = useGameStore((s) => s.goHome)
  const returnToMenu = useGameStore((s) => s.returnToMenu)
  const myTeam = useGameStore((s) => s.myTeam)
  const records = useGameStore((s) => s.records)
  const leagueTeams = useGameStore((s) => s.leagueTeams)
  const pendingOffers = useGameStore((s) => s.pendingOffers)
  const config = useGameStore((s) => s.config)

  const offCount = pendingOffers.length

  const groups: NavGroupDef[] = [
    {
      key: 'gm',
      label: 'GM',
      pages: GM_PAGES,
      minWidth: 200,
      items: [
        sec('ROSTER'),
        it('View Roster', 'roster'),
        it('Depth Chart', 'depthChart'),
        sec('MOVES'),
        it('Trade Center', 'trades'),
        it(offCount > 0 ? `Trade Offers (${offCount})` : 'Trade Offers', 'tradeOffers'),
        it('Free Agency', 'freeAgency'),
        it('Waiver Wire', 'waivers'),
        sec('FINANCES'),
        it('Salary Cap', 'salaryCap'),
        it('Contracts', 'contracts')
      ]
    },
    {
      key: 'coach',
      label: 'Coach',
      pages: COACH_PAGES,
      minWidth: 200,
      items: [
        sec('STRATEGY'),
        it('Game Plan', 'gamePlan'),
        it('Rotations', 'rotations'),
        sec('PLAYERS'),
        it('Scouting Report', 'scouting'),
        it('Player Development', 'development'),
        it('Injuries', 'injuries')
      ]
    },
    {
      key: 'league',
      label: 'League',
      pages: LEAGUE_PAGES,
      minWidth: 210,
      items: [
        sec('STANDINGS'),
        it('Conference Standings', 'standings'),
        sec('SCHEDULE'),
        it('My Schedule', 'schedule'),
        it('Calendar', 'calendar'),
        sec('STATS'),
        it('Player Stats', 'playerStats'),
        it('Team Stats', 'teamStats'),
        sec('GAME'),
        it('Last Box Score', 'boxScore'),
        it('All-Star Game', 'allStarGame'),
        it('Transactions', 'transactions'),
        sec('POSTSEASON'),
        it('Playoffs', 'playoffs')
      ]
    },
    {
      key: 'comm',
      label: 'Commissioner',
      pages: COMM_PAGES,
      minWidth: 200,
      items: [
        sec('SETTINGS'),
        it('League Rules', 'leagueRules'),
        it('Salary Cap Rules', 'salaryCapRules'),
        it('Rule Changes', 'ruleChanges'),
        sec('DRAFT'),
        it('Draft Room', 'draft'),
        it('Draft Combine', 'draftCombine'),
        it('Prospect Scouting', 'prospectScouting'),
        it('Draft Order', 'draftOrder'),
        it('Expansion Teams', 'expansion'),
        sec('OFFSEASON'),
        it('Offseason Hub', 'offseason')
      ]
    }
  ]

  // Team badge — generalized from the source mock's hardcoded Lakers colors.
  const team = TEAM_DATA[myTeam]
  const primary = team?.primary ?? '#552583'
  const textColor = getTextColor(primary)
  const fullName = team ? `${team.city} ${team.name}` : myTeam
  const record = records[myTeam]
  const recordStr = record ? `${record.w}–${record.l}` : '0–0'

  const myConfIndex = leagueTeams.find((t) => t.abbr === myTeam)?.confIndex ?? 0
  const confName = config?.conferences[myConfIndex]?.name ?? (myConfIndex === 1 ? 'West' : 'East')
  const confTeams = leagueTeams.filter((t) => t.confIndex === myConfIndex)
  const rankSorted = [...confTeams].sort((a, b) => (records[b.abbr]?.w ?? 0) - (records[a.abbr]?.w ?? 0))
  const rank = rankSorted.findIndex((t) => t.abbr === myTeam)
  const standingStr = rank >= 0 ? `${rank + 1}${ordinal(rank + 1)} ${confName}` : confName

  const logoStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginRight: 32,
    flexShrink: 0,
    cursor: 'pointer'
  }

  return (
    <nav style={{ background: COLORS.navDark, color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'stretch',
          height: 52
        }}
      >
        <div style={logoStyle} onClick={goHome}>
          <div
            style={{
              width: 28,
              height: 28,
              background: COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 12,
                color: 'white',
                letterSpacing: -0.5
              }}
            >
              FPS
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 13,
                color: 'white',
                letterSpacing: 1,
                lineHeight: 1.1
              }}
            >
              FRONT PAGE SPORTS
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 7,
                color: '#3A3A36',
                letterSpacing: 2,
                textTransform: 'uppercase'
              }}
            >
              Basketball 2026
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, gap: 0 }}>
          {groups.map((g) => {
            const active = openDropdown === g.key || g.pages.includes(page)
            const color = active ? COLORS.accent : '#8A8A86'
            const border = active ? COLORS.accent : 'transparent'
            const show = openDropdown === g.key
            return (
              <div
                key={g.key}
                onMouseEnter={() => setOpenDropdown(g.key)}
                onMouseLeave={() => setOpenDropdown(null)}
                style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
              >
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${border}`,
                    color,
                    cursor: 'pointer',
                    padding: '0 16px',
                    fontFamily: FONTS.display,
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {g.label} <span style={{ fontSize: 7, opacity: 0.5 }}>&#9662;</span>
                </button>
                {show ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: 'white',
                      minWidth: g.minWidth,
                      boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                      zIndex: 200,
                      borderTop: `2px solid ${COLORS.accent}`
                    }}
                  >
                    {g.items.map((item, idx) =>
                      item.isSection ? (
                        <div
                          key={idx}
                          style={{
                            padding: '9px 16px 3px',
                            fontFamily: FONTS.mono,
                            fontSize: 8,
                            color: COLORS.textFaint,
                            letterSpacing: 3,
                            textTransform: 'uppercase'
                          }}
                        >
                          {item.label}
                        </div>
                      ) : (
                        <div
                          key={idx}
                          onClick={() => item.page && goToPage(item.page)}
                          className="hover-bg-tint"
                          style={{
                            padding: '8px 16px 8px 22px',
                            fontFamily: FONTS.body,
                            fontSize: 13,
                            color: COLORS.textPrimary,
                            cursor: 'pointer',
                            borderBottom: '1px solid #F7F6F3'
                          }}
                        >
                          {item.label}
                        </div>
                      )
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            paddingLeft: 16,
            borderLeft: '1px solid #1E1E1B'
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span
              style={{
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 9,
                color: textColor,
                letterSpacing: 0.5
              }}
            >
              {myTeam}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>
              {fullName}
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: '#5A5A56', letterSpacing: 1 }}>
              {recordStr} &middot; {standingStr}
            </div>
          </div>
          <button
            onClick={returnToMenu}
            title="Return to Menu"
            className="hover-bg-tint"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              background: 'none',
              border: `1px solid #2A2A26`,
              color: '#8A8A86',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: 4
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
