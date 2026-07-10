// Builds a real leaguewide player leaderboard out of the actual persisted
// rosters (myRoster + every CPU team's rosters entry), instead of the old
// hand-authored, disconnected-from-any-roster LEAGUE_PLAYERS static array.
// Shared by PlayerStats.tsx (full sortable leaderboard) and Home.tsx
// (Who's Hot / Who's Not top/bottom-5 cards).
import type { RosterPlayer } from '@shared/types'
import type { LeagueTeam } from '@renderer/data/engine'

export interface LeaderRow {
  name: string
  team: string
  pos: string
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  teamPrimary: string
}

// RosterPlayer.stl/blk are real accumulated season averages once a player
// has taken the floor in a simulated game (see engine.ts's
// `accumulateSeasonStats`). This is only a fallback for legacy/hand-authored
// players (e.g. the human's starting template) that predate those fields.
function seedStl(p: RosterPlayer): number {
  const posBoost = p.pos === 'PG' ? 0.55 : p.pos === 'SG' ? 0.25 : p.pos === 'SF' ? 0.1 : 0
  return Math.max(0.2, 0.4 + (p.ovr / 100) * 1.2 + posBoost)
}

function seedBlk(p: RosterPlayer): number {
  const posBoost = p.pos === 'C' ? 0.9 : p.pos === 'PF' ? 0.45 : p.pos === 'SF' ? 0.1 : 0
  return Math.max(0.1, 0.15 + (p.ovr / 100) * 0.7 + posBoost)
}

export function buildLeagueLeaderboard(
  myTeam: string,
  myRoster: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  leagueTeams: LeagueTeam[]
): LeaderRow[] {
  const primaryOf = (abbr: string): string => leagueTeams.find((t) => t.abbr === abbr)?.primary ?? '#AEACA8'

  const rows: LeaderRow[] = []
  const pushRoster = (abbr: string, roster: RosterPlayer[]): void => {
    const teamPrimary = primaryOf(abbr)
    roster.forEach((p) => {
      rows.push({
        name: p.name,
        team: abbr,
        pos: p.pos,
        pts: p.pts,
        reb: p.reb,
        ast: p.ast,
        stl: p.stl ?? seedStl(p),
        blk: p.blk ?? seedBlk(p),
        teamPrimary
      })
    })
  }

  pushRoster(myTeam, myRoster)
  Object.entries(rosters).forEach(([abbr, roster]) => {
    if (abbr === myTeam) return // myRoster is the live source of truth for the human team
    pushRoster(abbr, roster)
  })

  return rows
}
