// Simulation engine for Empire Hoops. Every one of the 30 teams has a real,
// persisted roster (`RosterPlayer[]`) that evolves through trades, free
// agency, the draft, aging, and injuries — standings and outcomes emerge
// from actual team strength rather than a self-reinforcing win/loss random
// walk. Kept framework-free (pure functions) so it's easy to reason about
// and call from the zustand game store.
import { NBA_TEAMS, TEAM_DATA, type NbaTeam } from '@renderer/data/teams'
import { LAL_ROSTER, FIRST_INITIALS, SURNAMES } from '@renderer/data/players'
import { fmtMoney, ovrColor } from '@renderer/styles/theme'
import type {
  AgentResponseKind,
  BoxScore,
  BoxScorePlayerLine,
  CombineMeasurables,
  DraftPhase,
  DraftPick,
  DraftPickAsset,
  DraftProspect,
  FreeAgentNegotiation,
  FreeAgentOffer,
  GamePlanConfig,
  LeagueConfig,
  LeagueTeamSeed,
  LineupState,
  OffseasonCalendar,
  OffseasonSubPhase,
  PlayoffBracket,
  PlayoffSeries,
  RosterPlayer,
  ScheduledGame,
  ScoutedRange,
  SeasonCalendar,
  SimDate,
  TeamRecord,
  TradeOffer,
  TransactionEntry
} from '@shared/types'

export type LeagueTeam = LeagueTeamSeed

export const fmt$ = fmtMoney

export { ovrColor }

const ACC = 'oklch(0.62 0.21 42)'
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']
// Best-to-worst potential ladder shared by prospect generation and the
// scouting/combine fog-of-war narrowing below.
const POT = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+']

function addDays(d: SimDate, n: number): SimDate {
  const dt = new Date(d.y, d.m - 1, d.d + n)
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

// Formula-seeded preseason projection for steals/blocks — position/OVR based,
// same flavor-seed pattern as the existing pts/reb/ast formulas below. Used
// as a freshly-generated player's stat line until they've actually taken the
// floor (`gp` starts incrementing), at which point `accumulateSeasonStats`
// takes over with real per-game production.
function seedFlavorStl(pos: string, ovr: number): number {
  const posBoost = pos === 'PG' ? 0.55 : pos === 'SG' ? 0.25 : pos === 'SF' ? 0.1 : 0
  return Number(Math.max(0.2, 0.4 + (ovr / 100) * 1.2 + posBoost).toFixed(1))
}

function seedFlavorBlk(pos: string, ovr: number): number {
  const posBoost = pos === 'C' ? 0.9 : pos === 'PF' ? 0.45 : pos === 'SF' ? 0.1 : 0
  return Number(Math.max(0.1, 0.15 + (ovr / 100) * 0.7 + posBoost).toFixed(1))
}

// Ceiling OVR at generation time — younger players get more headroom above
// their current rating, giving the league a real spread of "already good"
// veterans vs. "still developing" youngsters. See applyProgression, which is
// the only thing that reads this after seeding.
function seedPotential(ovr: number, age: number): number {
  const ageRoom = age <= 21 ? 14 : age <= 24 ? 9 : age <= 27 ? 5 : age <= 30 ? 2 : 0
  return clampNum(ovr + Math.round(randRange(0, ageRoom)), ovr, 99)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function teamLabel(teams: LeagueTeam[], abbr: string): string {
  const t = teams.find((x) => x.abbr === abbr)
  return t ? `${t.city} ${t.name}` : abbr
}

// Splits every team in the league across the configured conferences. Real
// NBA teams keep their natural East/West split when the league has exactly
// two conferences (the common case the whole dashboard UI is designed
// around); anything else — 1, 3, or 4 conferences, or fictional expansion
// teams — is balanced round-robin since the wizard never collects a
// per-team conference assignment.
export function buildLeagueTeams(config: LeagueConfig): LeagueTeam[] {
  const confCount = Math.max(1, config.conferences.length)
  const real = config.selectedTeams
    .map((abbr) => TEAM_DATA[abbr])
    .filter((t): t is NbaTeam => !!t)
  const fictional = config.fictionalTeams

  const teams: LeagueTeam[] = []

  if (confCount === 2) {
    const counts = [0, 0]
    real.forEach((t) => {
      const idx = t.conf === 'East' ? 0 : 1
      counts[idx]++
      teams.push({ abbr: t.abbr, city: t.city, name: t.name, primary: t.primary, secondary: t.secondary, confIndex: idx })
    })
    fictional.forEach((t) => {
      const idx = counts[0] <= counts[1] ? 0 : 1
      counts[idx]++
      teams.push({ abbr: t.abbr, city: t.city, name: t.name, primary: t.primary, secondary: t.secondary, confIndex: idx })
    })
  } else {
    const ordered = [...real].sort((a, b) => (a.conf === b.conf ? a.abbr.localeCompare(b.abbr) : a.conf === 'East' ? -1 : 1))
    ;[...ordered, ...fictional].forEach((t, i) => {
      teams.push({ abbr: t.abbr, city: t.city, name: t.name, primary: t.primary, secondary: t.secondary, confIndex: i % confCount })
    })
  }

  return teams
}

export interface StandingRow extends LeagueTeam {
  w: number
  l: number
  l10: string
  rank: number
  pct: string
  gb: string
  playoffCut: boolean
  playInCut: boolean
  rowBg: string
  nameColor: string
  fw: string
  rankColor: string
}

export function buildStandings(
  teams: LeagueTeam[],
  records: Record<string, TeamRecord>,
  confIndex: number,
  myTeam: string,
  playoffTeamsPerConf: number
): StandingRow[] {
  const inConf = teams
    .filter((t) => t.confIndex === confIndex)
    .map((t) => ({ ...t, ...(records[t.abbr] ?? { w: 0, l: 0, l10: '0-0' }) }))
    .sort((a, b) => b.w - a.w || a.l - b.l)
  if (inConf.length === 0) return []
  const lw = inConf[0].w
  const ll = inConf[0].l
  const playoffCutIdx = Math.max(0, Math.min(inConf.length - 1, playoffTeamsPerConf - 3))
  const playInCutIdx = Math.max(0, Math.min(inConf.length - 1, playoffTeamsPerConf + 1))
  return inConf.map((t, i) => {
    const pct = t.w / Math.max(1, t.w + t.l)
    const gb = i === 0 ? '—' : (lw - t.w + (t.l - ll)) / 2
    const mine = t.abbr === myTeam
    return {
      ...t,
      rank: i + 1,
      pct: pct.toFixed(3).replace(/^0/, ''),
      gb: gb === 0 ? '—' : typeof gb === 'number' ? (gb % 1 === 0 ? String(gb) : gb.toFixed(1)) : '—',
      playoffCut: i === playoffCutIdx,
      playInCut: i === playInCutIdx,
      rowBg: mine ? 'oklch(0.988 0.012 42)' : 'white',
      nameColor: mine ? 'oklch(0.45 0.19 42)' : '#141412',
      fw: mine ? '700' : '400',
      rankColor: i <= playoffCutIdx ? ACC : i <= playInCutIdx ? '#767672' : '#C0BEB9'
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────
// League roster generation — every non-human team gets a real, persisted
// 15-man roster (3 per position) shaped around a randomly-drawn quality
// tier, so the league has a genuine spread of good/bad teams from day one.
// ─────────────────────────────────────────────────────────────────────────

const POSITION_TEMPLATE = ['PG', 'PG', 'PG', 'SG', 'SG', 'SG', 'SF', 'SF', 'SF', 'PF', 'PF', 'PF', 'C', 'C', 'C']
// Biggest star first — shuffled against a randomized position order per team
// so a team's best player isn't always at the same position league-wide.
const OVR_CURVE = [14, 9, 6, 4, 2, -2, -4, -6, -8, -10, -12, -14, -16, -18, -20]

// Exported so a single new team (e.g. a mid-game expansion franchise) can be
// generated without needing the full-league `genLeagueRosters` loop.
export function generateOneRoster(qualityTier: number, idStart: number, usedNames: Set<string>): { roster: RosterPlayer[]; nextId: number } {
  let id = idStart
  const baseOvr = 68 + qualityTier * 22 // ~68 (tier 0) to ~90 (tier 1)
  const positions = shuffle(POSITION_TEMPLATE)
  const roster = positions.map((pos, i) => {
    let name: string
    do {
      name = `${FIRST_INITIALS[Math.floor(Math.random() * FIRST_INITIALS.length)]}. ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`
    } while (usedNames.has(name))
    usedNames.add(name)
    const ovr = Math.max(60, Math.min(99, Math.round(baseOvr + OVR_CURVE[i] + randRange(-2, 2))))
    const age = i === 0 ? Math.round(randRange(24, 32)) : Math.round(randRange(20, 34))
    const pts = Math.max(1, (ovr - 60) * 0.55 + randRange(-1, 1))
    const reb = pos === 'C' ? randRange(5, 11) : pos === 'PF' ? randRange(4, 9) : pos === 'PG' ? randRange(1.5, 4) : randRange(2, 5)
    const ast = pos === 'PG' ? randRange(3, 9) : pos === 'SG' ? randRange(1.5, 5) : randRange(1, 3)
    const salary = Math.round((ovr - 60) * 650000 + randRange(1_500_000, 2_500_000))
    const yrs = Math.round(randRange(1, 4))
    return {
      id: id++,
      name,
      pos,
      age,
      ovr,
      pts: Number(pts.toFixed(1)),
      reb: Number(reb.toFixed(1)),
      ast: Number(ast.toFixed(1)),
      salary,
      yrs,
      status: 'Active' as const,
      gp: 0,
      stl: seedFlavorStl(pos, ovr),
      blk: seedFlavorBlk(pos, ovr),
      potential: seedPotential(ovr, age)
    }
  })
  return { roster, nextId: id }
}

// Called once at league creation. The human keeps the hand-curated
// `LAL_ROSTER` template (a nice flavor hook); every other team is
// procedurally generated with its own random quality tier.
export function genLeagueRosters(
  teams: LeagueTeam[],
  myTeam: string,
  startId: number
): { rosters: Record<string, RosterPlayer[]>; nextId: number } {
  const rosters: Record<string, RosterPlayer[]> = {}
  const usedNames = new Set<string>()
  let id = startId
  teams.forEach((t) => {
    if (t.abbr === myTeam) return
    const tier = Math.random()
    const { roster, nextId } = generateOneRoster(tier, id, usedNames)
    rosters[t.abbr] = roster
    id = nextId
  })
  return { rosters, nextId: id }
}

export function cloneMyRosterTemplate(): RosterPlayer[] {
  return LAL_ROSTER.map((p) => ({ ...p, potential: seedPotential(p.ovr, p.age) }))
}

// Seeds an initial pool of unattached players (not tied to any team) for the
// free-agent market at league creation — modest quality, mixed positions,
// the kind of veteran/depth talent that's realistically unsigned on day one.
export function generatePlayerPool(count: number, startId: number, usedNames: Set<string>): { pool: RosterPlayer[]; nextId: number } {
  let id = startId
  const pool: RosterPlayer[] = Array.from({ length: count }, () => {
    let name: string
    do {
      name = `${FIRST_INITIALS[Math.floor(Math.random() * FIRST_INITIALS.length)]}. ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`
    } while (usedNames.has(name))
    usedNames.add(name)
    const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)]
    const ovr = Math.round(randRange(62, 80))
    const age = Math.round(randRange(23, 34))
    const pts = Math.max(1, (ovr - 60) * 0.5 + randRange(-1, 1))
    const reb = pos === 'C' ? randRange(4, 9) : pos === 'PF' ? randRange(3, 7) : randRange(1.5, 4)
    const ast = pos === 'PG' ? randRange(2, 7) : randRange(1, 3)
    const salary = Math.round((ovr - 60) * 500000 + randRange(1_000_000, 2_000_000))
    return {
      id: id++,
      name,
      pos,
      age,
      ovr,
      pts: Number(pts.toFixed(1)),
      reb: Number(reb.toFixed(1)),
      ast: Number(ast.toFixed(1)),
      salary,
      yrs: 1,
      status: 'Active' as const,
      gp: 0,
      stl: seedFlavorStl(pos, ovr),
      blk: seedFlavorBlk(pos, ovr),
      potential: seedPotential(ovr, age)
    }
  })
  return { pool, nextId: id }
}

// ─────────────────────────────────────────────────────────────────────────
// Lineups & team strength — the single source of truth for how good a team
// is, used for win probability, CPU need-assessment, and box-score minutes.
// ─────────────────────────────────────────────────────────────────────────

// Best-five-by-position (skipping unavailable players), rest of the roster
// as bench in OVR order. Used as the human's default/reset lineup AND as
// every CPU team's "coaching" — no separate deep coaching AI needed since
// every team just plays its best available players.
export function autoLineup(roster: RosterPlayer[]): LineupState {
  const available = roster.filter((p) => p.status !== 'OUT' && p.status !== 'INJ')
  const used = new Set<number>()
  const starters: number[] = []
  POSITIONS.forEach((pos) => {
    const candidate = available.filter((p) => p.pos === pos && !used.has(p.id)).sort((a, b) => b.ovr - a.ovr)[0]
    if (candidate) {
      starters.push(candidate.id)
      used.add(candidate.id)
    }
  })
  while (starters.length < 5) {
    const next = available.filter((p) => !used.has(p.id)).sort((a, b) => b.ovr - a.ovr)[0]
    if (!next) break
    starters.push(next.id)
    used.add(next.id)
  }
  const bench = available
    .filter((p) => !used.has(p.id))
    .sort((a, b) => b.ovr - a.ovr)
    .map((p) => p.id)
  return { starters, bench }
}

// Weighted-average OVR of the actual chosen lineup (starters weighted above
// the next-4 rotation bench) — this is what makes a coach's lineup choices
// (or a CPU roster's real composition) actually move win probability.
export function teamStrength(roster: RosterPlayer[], lineup?: LineupState): number {
  const activeLineup = lineup ?? autoLineup(roster)
  const byId = new Map(roster.map((p) => [p.id, p]))
  const healthy = (id: number): RosterPlayer | null => {
    const p = byId.get(id)
    return p && p.status !== 'OUT' && p.status !== 'INJ' ? p : null
  }
  const starters = activeLineup.starters.map(healthy).filter((p): p is RosterPlayer => !!p)
  const rotation = activeLineup.bench.slice(0, 4).map(healthy).filter((p): p is RosterPlayer => !!p)
  if (starters.length === 0) {
    const avail = roster.filter((p) => p.status === 'Active' || p.status === 'GTD').sort((a, b) => b.ovr - a.ovr)
    return avail.length ? avail.slice(0, 5).reduce((a, p) => a + p.ovr, 0) / Math.min(5, avail.length) : 60
  }
  const startersAvg = starters.reduce((a, p) => a + p.ovr, 0) / starters.length
  const rotationAvg = rotation.length ? rotation.reduce((a, p) => a + p.ovr, 0) / rotation.length : startersAvg
  return startersAvg * 0.7 + rotationAvg * 0.3
}

function bestOvrAtPosition(roster: RosterPlayer[], pos: string): number {
  const atPos = roster.filter((p) => p.pos === pos)
  if (atPos.length === 0) return 55
  return Math.max(...atPos.map((p) => p.ovr))
}

function weakestPosition(roster: RosterPlayer[]): string {
  return POSITIONS.reduce((worst, pos) => (bestOvrAtPosition(roster, pos) < bestOvrAtPosition(roster, worst) ? pos : worst), POSITIONS[0])
}

// ─────────────────────────────────────────────────────────────────────────
// Player valuation — the single formula behind trade fairness, CPU trade
// generation, free-agency bidding priority, and draft scoring.
// ─────────────────────────────────────────────────────────────────────────

export function playerValue(p: RosterPlayer): number {
  const ovrComponent = Math.pow(Math.max(0, p.ovr - 60), 1.6)
  const ageFactor = p.age <= 23 ? 1.15 : p.age <= 27 ? 1.05 : p.age <= 30 ? 0.95 : p.age <= 33 ? 0.8 : 0.6
  const healthFactor = p.status === 'Active' ? 1 : p.status === 'GTD' ? 0.95 : 0.75
  const contractPenalty = (p.salary / 1_000_000) * 0.4
  return Math.max(0.1, ovrComponent * ageFactor * healthFactor - contractPenalty)
}

// ─────────────────────────────────────────────────────────────────────────
// Draft-pick valuation — lets CPU trade logic weigh a future pick against a
// player using the same scale as `playerValue`. A tanking team's own
// upcoming 1st values like a solid rotation player; a contender's own
// upcoming 1st is near-throwaway; picks further out discount 15%/year.
// ─────────────────────────────────────────────────────────────────────────

export interface PickValuationContext {
  teams: LeagueTeam[]
  records: Record<string, TeamRecord>
  rosters: Record<string, RosterPlayer[]>
  myRoster: RosterPlayer[]
  myTeam: string
  currentYear: number
}

export function pickValue(pick: DraftPickAsset, ctx: PickValuationContext): number {
  const originalRoster = pick.originalTeam === ctx.myTeam ? ctx.myRoster : ctx.rosters[pick.originalTeam] ?? []
  const rec = ctx.records[pick.originalTeam] ?? { w: 0, l: 0, l10: '0-0' }
  const winPct = rec.w + rec.l > 0 ? rec.w / (rec.w + rec.l) : 0.5
  const strengthPct = clampNum(((originalRoster.length ? teamStrength(originalRoster) : 72) - 60) / 30, 0, 1)
  const recordFactor = clampNum(0.2 + (1 - (winPct * 0.7 + strengthPct * 0.3)) * 1.2, 0.2, 1.4)
  const roundBase = pick.round === 1 ? 40 : 12
  const distanceDiscount = Math.pow(0.85, Math.max(0, pick.year - ctx.currentYear))
  return Math.max(1, roundBase * recordFactor * distanceDiscount)
}

// CPU fairness check for a trade proposed BY the human: does the CPU team
// receive enough value for what it's giving up? (`incoming`/`outgoing` are
// from the CPU team's point of view.)
export function evaluateTradeForTeam(
  incoming: RosterPlayer[],
  outgoing: RosterPlayer[],
  incomingPicks: DraftPickAsset[],
  outgoingPicks: DraftPickAsset[],
  ctx: PickValuationContext
): boolean {
  const incomingValue = incoming.reduce((a, p) => a + playerValue(p), 0) + incomingPicks.reduce((a, pk) => a + pickValue(pk, ctx), 0)
  const outgoingValue = outgoing.reduce((a, p) => a + playerValue(p), 0) + outgoingPicks.reduce((a, pk) => a + pickValue(pk, ctx), 0)
  if (outgoingValue === 0) return true
  return incomingValue >= outgoingValue * 0.7
}

const POTENTIAL_MULTIPLIER: Record<string, number> = { 'A+': 1.35, A: 1.25, 'A-': 1.15, 'B+': 1.05, B: 1.0, 'B-': 0.92, 'C+': 0.85 }

// Converts a prospect's scouting letter grade into a numeric ceiling once
// they're actually drafted onto a real roster — previously this signal was
// dropped entirely on promotion (see promotePicks).
const POT_CEILING_BONUS: Record<string, [number, number]> = {
  'A+': [12, 18],
  A: [9, 14],
  'A-': [7, 11],
  'B+': [5, 8],
  B: [3, 6],
  'B-': [1, 4],
  'C+': [0, 2]
}
function prospectPotential(letterGrade: string, ovr: number): number {
  const [lo, hi] = POT_CEILING_BONUS[letterGrade] ?? [2, 5]
  return clampNum(ovr + Math.round(randRange(lo, hi)), ovr, 99)
}

function positionNeedBonus(roster: RosterPlayer[], pos: string): number {
  return Math.max(0, 78 - bestOvrAtPosition(roster, pos)) * 0.6
}

export function scoreProspectForTeam(prospect: DraftProspect, teamRoster: RosterPlayer[]): number {
  const potentialMultiplier = POTENTIAL_MULTIPLIER[prospect.potential] ?? 1
  const valueLike = Math.pow(Math.max(0, prospect.ovr - 60), 1.6) * potentialMultiplier
  return valueLike + positionNeedBonus(teamRoster, prospect.pos)
}

export function pickBestProspectForTeam(prospects: DraftProspect[], teamRoster: RosterPlayer[]): DraftProspect | undefined {
  const available = prospects.filter((p) => !p.drafted)
  if (available.length === 0) return undefined
  return available.reduce((best, p) => (scoreProspectForTeam(p, teamRoster) > scoreProspectForTeam(best, teamRoster) ? p : best))
}

// ─────────────────────────────────────────────────────────────────────────
// Possession-by-possession game simulation — the final score and every box
// score stat (points, rebounds, assists, shooting splits, steals, blocks,
// plus/minus) now emerge from real simulated possessions (shot selection,
// makes/misses, rebounds, turnovers, fouls) instead of being reverse-
// engineered from a pre-decided random score. Stays a statistical sim —
// arithmetic per possession, no court positions or physics.
// ─────────────────────────────────────────────────────────────────────────

// Orders a roster starters-first (in lineup slot order), then bench in
// rotation-priority order, then anything not in the lineup (e.g. a player
// added after the lineup was last set) appended at the end so nobody's ever
// silently dropped from the box score.
function orderRosterByLineup(lineup: LineupState, roster: RosterPlayer[]): RosterPlayer[] {
  const byId = new Map(roster.map((p) => [p.id, p]))
  const used = new Set<number>()
  const ordered: RosterPlayer[] = []
  ;[...lineup.starters, ...lineup.bench].forEach((id) => {
    const p = byId.get(id)
    if (p && !used.has(id)) {
      ordered.push(p)
      used.add(id)
    }
  })
  roster.forEach((p) => {
    if (!used.has(p.id)) ordered.push(p)
  })
  return ordered
}

type ShotType = 'three' | 'mid' | 'paint'

const POSITION_SHOT_BASE: Record<string, { three: number; post: number }> = {
  PG: { three: 0.4, post: 0.1 },
  SG: { three: 0.45, post: 0.1 },
  SF: { three: 0.38, post: 0.18 },
  PF: { three: 0.22, post: 0.35 },
  C: { three: 0.1, post: 0.55 }
}
const REB_POS_BOOST: Record<string, number> = { PG: 0.6, SG: 0.75, SF: 1.0, PF: 1.35, C: 1.6 }
const STL_POS_BOOST: Record<string, number> = { PG: 1.5, SG: 1.25, SF: 1.0, PF: 0.7, C: 0.5 }
const BLK_POS_BOOST: Record<string, number> = { PG: 0.4, SG: 0.5, SF: 0.9, PF: 1.3, C: 1.6 }
const AST_POS_BOOST: Record<string, number> = { PG: 1.7, SG: 1.25, SF: 1.0, PF: 0.7, C: 0.55 }
const BASE_FG: Record<ShotType, number> = { three: 0.36, mid: 0.42, paint: 0.58 }
const FOUL_BASE: Record<ShotType, number> = { three: 0.03, mid: 0.06, paint: 0.12 }
const OREB_BASE: Record<ShotType, number> = { three: 0.24, mid: 0.28, paint: 0.32 }

// A slider at 50 has no effect; 0/100 swing by ±magnitude/2. Shared by every
// GamePlanConfig-driven nudge in the possession model.
function sliderEffect(slider: number, magnitude: number): number {
  return ((slider - 50) / 100) * magnitude
}

function roleBaseWeight(i: number): number {
  return i < 5 ? 1.0 : i < 9 ? 0.55 : i < 12 ? 0.15 : 0.05
}

function ovrFactor(ovr: number): number {
  return clampNum(0.5 + (ovr - 60) / 40, 0.3, 1.8)
}

// How likely a player is to be part of the on-court 5 for any given
// possession — role (starter/rotation/deep bench) times an OVR-driven
// star-usage bump. Sampled fresh every possession (see `sampleFive`), which
// naturally produces realistic minutes distribution with no separate
// rotation scheduler.
function weightOf(p: RosterPlayer, i: number): number {
  return roleBaseWeight(i) * ovrFactor(p.ovr)
}

function rebStrength(p: RosterPlayer): number {
  return p.ovr * (REB_POS_BOOST[p.pos] ?? 1)
}

function shotProfile(p: RosterPlayer, gamePlan: GamePlanConfig): { three: number; mid: number; paint: number } {
  const base = POSITION_SHOT_BASE[p.pos] ?? POSITION_SHOT_BASE.SF
  const three = clampNum(base.three + sliderEffect(gamePlan.threePoint, 0.5), 0.05, 0.85)
  const post = clampNum(base.post + sliderEffect(gamePlan.post, 0.5), 0.05, 0.85)
  const mid = Math.max(0.05, 1 - three - post)
  const sum = three + post + mid
  return { three: three / sum, mid: mid / sum, paint: post / sum }
}

function weightedPick<T>(items: T[], weightFn: (t: T) => number): T {
  const weights = items.map(weightFn)
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return items[Math.floor(Math.random() * items.length)]
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

interface EligibleEntry {
  p: RosterPlayer
  w: number
}

// Weighted-random-without-replacement (Efraimidis–Spirakis): pick the 5
// highest `Math.random()**(1/weight)` keys. Cheap (O(n log n) on <=12 items)
// and re-run every possession, independently for offense and defense.
function sampleFive(pool: EligibleEntry[]): EligibleEntry[] {
  if (pool.length <= 5) return pool
  return pool
    .map((x) => ({ x, key: Math.pow(Math.random(), 1 / Math.max(0.01, x.w)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, 5)
    .map((e) => e.x)
}

interface PlayerGameLine {
  id: number
  name: string
  pos: string
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  fgm: number
  fga: number
  tpm: number
  tpa: number
  ftm: number
  fta: number
  pm: number
}

interface TeamGameLine {
  pts: number
  q: [number, number, number, number]
  players: PlayerGameLine[]
}

export interface GameSimResult {
  home: TeamGameLine
  away: TeamGameLine
  wentToOT: boolean
  otPeriods: number
}

interface SimSide {
  eligible: EligibleEntry[]
  gamePlan: GamePlanConfig
  lines: Map<number, PlayerGameLine & { onFloor: number }>
  pts: number
}

function makeSide(roster: RosterPlayer[], lineup: LineupState, gamePlan: GamePlanConfig): SimSide {
  const ordered = orderRosterByLineup(lineup, roster).filter((p) => p.status !== 'OUT' && p.status !== 'INJ')
  const eligible: EligibleEntry[] = ordered.slice(0, 12).map((p, i) => ({ p, w: weightOf(p, i) }))
  if (eligible.length < 5) {
    const used = new Set(eligible.map((e) => e.p.id))
    roster.forEach((p) => {
      if (eligible.length >= 5 || used.has(p.id)) return
      eligible.push({ p, w: 0.05 })
    })
  }
  const lines = new Map<number, PlayerGameLine & { onFloor: number }>()
  eligible.forEach(({ p }) => {
    lines.set(p.id, {
      id: p.id,
      name: p.name,
      pos: p.pos,
      min: 0,
      pts: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      pm: 0,
      onFloor: 0
    })
  })
  return { eligible, gamePlan, lines, pts: 0 }
}

function finalizeSide(side: SimSide, otPeriods: number, possessionsPerTeam: number, otPossessionsPerTeam: number): PlayerGameLine[] {
  const totalOnFloorSlots = 2 * (possessionsPerTeam + otPeriods * otPossessionsPerTeam)
  const totalMinutes = 48 + 5 * otPeriods
  return side.eligible
    .map(({ p }) => {
      const line = side.lines.get(p.id)!
      const min = totalOnFloorSlots > 0 ? Math.round((totalMinutes * line.onFloor) / totalOnFloorSlots) : 0
      return {
        id: line.id,
        name: line.name,
        pos: line.pos,
        min,
        pts: line.pts,
        reb: line.reb,
        ast: line.ast,
        stl: line.stl,
        blk: line.blk,
        fgm: line.fgm,
        fga: line.fga,
        tpm: line.tpm,
        tpa: line.tpa,
        ftm: line.ftm,
        fta: line.fta,
        pm: line.pm
      }
    })
    .sort((a, b) => b.pts - a.pts)
}

// The core possession-resolution loop for one team's turn on offense: rolls
// a turnover first, then up to 3 shot attempts (offensive rebounds let the
// same on-court 5 keep shooting, capped so the outer possession count never
// changes), resolving shot type, shooter, fouls/free-throws, makes/misses,
// blocks, rebounds, and assists along the way.
function runPossession(offense: SimSide, defense: SimSide, isHome: boolean, neutralSite: boolean): void {
  const offense5 = sampleFive(offense.eligible)
  const defense5 = sampleFive(defense.eligible)
  offense5.forEach((e) => (offense.lines.get(e.p.id)!.onFloor += 1))
  defense5.forEach((e) => (defense.lines.get(e.p.id)!.onFloor += 1))

  const defRating = defense5.reduce((a, e) => a + e.p.ovr, 0) / defense5.length
  const astWeightTotal = offense5.reduce((a, e) => a + (AST_POS_BOOST[e.p.pos] ?? 1), 0) || 1
  const ballHandlerOvr = offense5.reduce((a, e) => a + e.p.ovr * (AST_POS_BOOST[e.p.pos] ?? 1), 0) / astWeightTotal
  const defenseSliderPenalty = sliderEffect(defense.gamePlan.defense, 0.05)
  const turnoverProb = clampNum(0.13 + defenseSliderPenalty - (ballHandlerOvr - 75) * 0.002, 0.06, 0.24)

  if (Math.random() < turnoverProb) {
    if (Math.random() < 0.55) {
      const stealer = weightedPick(defense5, (e) => STL_POS_BOOST[e.p.pos] ?? 1).p
      defense.lines.get(stealer.id)!.stl += 1
    }
    return
  }

  let attempts = 0
  let possessionOver = false
  while (!possessionOver && attempts < 3) {
    attempts++
    const totalW = offense5.reduce((a, e) => a + e.w, 0) || 1
    const mix = { three: 0, mid: 0, paint: 0 }
    const profiles = offense5.map((e) => ({ e, profile: shotProfile(e.p, offense.gamePlan) }))
    profiles.forEach(({ e, profile }) => {
      mix.three += (profile.three * e.w) / totalW
      mix.mid += (profile.mid * e.w) / totalW
      mix.paint += (profile.paint * e.w) / totalW
    })
    const shotRoll = Math.random() * (mix.three + mix.mid + mix.paint || 1)
    const shotType: ShotType = shotRoll < mix.three ? 'three' : shotRoll < mix.three + mix.mid ? 'mid' : 'paint'
    const shooter = weightedPick(profiles, ({ e, profile }) => e.w * profile[shotType]).e

    const foulProb = clampNum(FOUL_BASE[shotType] + sliderEffect(defense.gamePlan.defense, 0.03), 0.01, 0.3)
    if (Math.random() < foulProb) {
      const ftCount = shotType === 'three' ? 3 : 2
      const line = offense.lines.get(shooter.p.id)!
      const ftProb = clampNum(0.75 + (shooter.p.ovr - 75) * 0.004, 0.55, 0.95)
      for (let f = 0; f < ftCount; f++) {
        line.fta += 1
        if (Math.random() < ftProb) {
          line.ftm += 1
          line.pts += 1
          offense.pts += 1
          line.pm += 1
          defense5.forEach((d) => (defense.lines.get(d.p.id)!.pm -= 1))
        }
      }
      possessionOver = true
      break
    }

    const skill = (shooter.p.ovr - 75) * 0.006
    const defTerm = (defRating - 75) * -0.005
    const homeEdge = isHome && !neutralSite ? 0.015 : 0
    const paintFB = shotType === 'paint' ? sliderEffect(offense.gamePlan.fastBreak, 0.08) : 0
    const threeBM = shotType === 'three' ? sliderEffect(offense.gamePlan.ballMovement, 0.06) : 0
    const makeProb = clampNum(BASE_FG[shotType] + skill + defTerm - defenseSliderPenalty + homeEdge + paintFB + threeBM, 0.12, 0.85)

    const line = offense.lines.get(shooter.p.id)!
    line.fga += 1
    if (shotType === 'three') line.tpa += 1

    if (Math.random() < makeProb) {
      const pts = shotType === 'three' ? 3 : 2
      line.fgm += 1
      if (shotType === 'three') line.tpm += 1
      line.pts += pts
      offense.pts += pts
      offense5.forEach((o) => (offense.lines.get(o.p.id)!.pm += pts))
      defense5.forEach((d) => (defense.lines.get(d.p.id)!.pm -= pts))

      const assistProb = clampNum(
        0.42 + sliderEffect(offense.gamePlan.ballMovement, 0.5) + (shotType === 'three' ? 0.12 : 0) - (shotType === 'paint' ? 0.05 : 0),
        0.15,
        0.85
      )
      if (Math.random() < assistProb) {
        const others = offense5.filter((e) => e.p.id !== shooter.p.id)
        if (others.length > 0) {
          const assister = weightedPick(others, (e) => AST_POS_BOOST[e.p.pos] ?? 1).p
          offense.lines.get(assister.id)!.ast += 1
        }
      }
      possessionOver = true
    } else {
      const blockProb = clampNum(0.06 + (defRating - 75) * 0.002 + (shotType === 'paint' ? 0.03 : 0), 0.02, 0.18)
      if (Math.random() < blockProb) {
        const blocker = weightedPick(defense5, (e) => BLK_POS_BOOST[e.p.pos] ?? 1).p
        defense.lines.get(blocker.id)!.blk += 1
      }
      const offRebStrength = offense5.reduce((a, e) => a + rebStrength(e.p), 0) / offense5.length
      const defRebStrength = defense5.reduce((a, e) => a + rebStrength(e.p), 0) / defense5.length
      const oRebProb = clampNum(
        OREB_BASE[shotType] + (offRebStrength - defRebStrength) * 0.01 + sliderEffect(offense.gamePlan.post, 0.05),
        0.1,
        0.45
      )
      if (attempts < 3 && Math.random() < oRebProb) {
        const rebounder = weightedPick(offense5, (e) => rebStrength(e.p)).p
        offense.lines.get(rebounder.id)!.reb += 1
        // Offensive rebound — the same sampled 5 keep shooting (loop continues).
      } else {
        const rebounder = weightedPick(defense5, (e) => rebStrength(e.p)).p
        defense.lines.get(rebounder.id)!.reb += 1
        possessionOver = true
      }
    }
  }
}

// The core possession-by-possession simulator: every made/missed shot,
// rebound, assist, turnover, and foul actually happens and gets tallied, so
// the final score and every box-score stat emerge organically rather than
// being reverse-engineered from a pre-decided random total. `neutralSite`
// (true for playoffs, matching prior behavior) zeroes the home-court edge.
export function simulateGame(
  homeRoster: RosterPlayer[],
  homeLineup: LineupState,
  homeGamePlan: GamePlanConfig,
  awayRoster: RosterPlayer[],
  awayLineup: LineupState,
  awayGamePlan: GamePlanConfig,
  neutralSite = false
): GameSimResult {
  const home = makeSide(homeRoster, homeLineup, homeGamePlan)
  const away = makeSide(awayRoster, awayLineup, awayGamePlan)

  const gamePace = (homeGamePlan.pace + awayGamePlan.pace) / 2
  // Real NBA teams run ~85-115 possessions/game; each "event" here already
  // maps 1:1 to a true possession (offensive rebounds extend the SAME event
  // via the inner shot-attempt loop rather than consuming another one).
  const possessionsPerTeam = clampNum(Math.round(85 + gamePace * 0.35), 80, 120)
  const totalEvents = possessionsPerTeam * 2
  const quarterBounds = [0.25, 0.5, 0.75, 1].map((f) => Math.round(totalEvents * f))

  const scoreSnapshots: Array<[number, number]> = [[0, 0]]
  let quarterIdx = 0
  let offenseIsHome = true
  for (let ev = 0; ev < totalEvents; ev++) {
    if (offenseIsHome) runPossession(home, away, true, neutralSite)
    else runPossession(away, home, false, neutralSite)
    offenseIsHome = !offenseIsHome

    if (quarterIdx < 4 && ev + 1 === quarterBounds[quarterIdx]) {
      scoreSnapshots.push([home.pts, away.pts])
      quarterIdx++
    }
  }

  const qHome: [number, number, number, number] = [0, 0, 0, 0]
  const qAway: [number, number, number, number] = [0, 0, 0, 0]
  for (let q = 0; q < 4; q++) {
    qHome[q] = scoreSnapshots[q + 1][0] - scoreSnapshots[q][0]
    qAway[q] = scoreSnapshots[q + 1][1] - scoreSnapshots[q][1]
  }
  const regHomePts = home.pts
  const regAwayPts = away.pts

  // Regulation ties are always broken by at least one OT period, regardless
  // of the (otherwise-inert) RuleFlags.overtime toggle — simpler than
  // modeling the flag's implied alternate tiebreaker format.
  let otPeriods = 0
  let wentToOT = false
  const otPossessionsPerTeam = Math.max(6, Math.round((possessionsPerTeam * 5) / 48))
  while (home.pts === away.pts && otPeriods < 4) {
    wentToOT = true
    otPeriods++
    let otOffenseIsHome = true
    for (let ev = 0; ev < otPossessionsPerTeam * 2; ev++) {
      if (otOffenseIsHome) runPossession(home, away, true, neutralSite)
      else runPossession(away, home, false, neutralSite)
      otOffenseIsHome = !otOffenseIsHome
    }
  }
  if (home.pts === away.pts) {
    // Astronomically unlikely after 4 OT periods — break via team strength,
    // coin flip only on exact equality.
    const sh = teamStrength(homeRoster, homeLineup)
    const sa = teamStrength(awayRoster, awayLineup)
    if (sh > sa || (sh === sa && Math.random() < 0.5)) home.pts += 1
    else away.pts += 1
  }
  qHome[3] += home.pts - regHomePts
  qAway[3] += away.pts - regAwayPts

  return {
    home: { pts: home.pts, q: qHome, players: finalizeSide(home, otPeriods, possessionsPerTeam, otPossessionsPerTeam) },
    away: { pts: away.pts, q: qAway, players: finalizeSide(away, otPeriods, possessionsPerTeam, otPossessionsPerTeam) },
    wentToOT,
    otPeriods
  }
}

function lineToBoxLine(l: PlayerGameLine): BoxScorePlayerLine {
  return {
    id: l.id,
    name: l.name,
    pos: l.pos,
    min: l.min,
    pts: l.pts,
    reb: l.reb,
    ast: l.ast,
    stl: l.stl,
    blk: l.blk,
    fgStr: `${l.fgm}/${l.fga}`,
    threeStr: `${l.tpm}/${l.tpa}`,
    ftStr: `${l.ftm}/${l.fta}`,
    pm: l.pm >= 0 ? `+${l.pm}` : String(l.pm)
  }
}

// Maps a simulated game straight into the existing (unchanged) BoxScore
// shape. `mySide` picks which side of the sim is "my" team for display,
// since `simulateGame`'s home/away only matters for the home-court edge —
// the human's own game can be scheduled as either.
export function toBoxScore(
  result: GameSimResult,
  mySide: 'home' | 'away',
  opp: string,
  oppName: string,
  oppColor: string,
  dateStr: string,
  won: boolean,
  myName?: string,
  myColor?: string
): BoxScore {
  const mine = mySide === 'home' ? result.home : result.away
  const theirs = mySide === 'home' ? result.away : result.home
  return {
    opp,
    oppName,
    oppColor,
    ...(myName !== undefined ? { myName } : {}),
    ...(myColor !== undefined ? { myColor } : {}),
    won,
    myPts: mine.pts,
    oppPts: theirs.pts,
    dateStr,
    q1l: mine.q[0],
    q2l: mine.q[1],
    q3l: mine.q[2],
    q4l: mine.q[3],
    q1o: theirs.q[0],
    q2o: theirs.q[1],
    q3o: theirs.q[2],
    q4o: theirs.q[3],
    myPlayers: mine.players.map(lineToBoxLine),
    oppPlayers: theirs.players.map(lineToBoxLine)
  }
}

// Every CPU team's shot mix/pace emerges from its actual roster personnel —
// no stored/editable config for CPU teams. Strong perimeter OVR shoots more
// threes, a bigs-heavy roster leans post/paint, a younger/deeper roster
// pushes pace — giving the league real stylistic variety.
export function deriveCpuGamePlan(roster: RosterPlayer[], lineup?: LineupState): GamePlanConfig {
  const ordered = orderRosterByLineup(lineup ?? autoLineup(roster), roster).slice(0, 9)
  const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 72)
  const perimOvr = avg(ordered.filter((p) => p.pos !== 'PF' && p.pos !== 'C').map((p) => p.ovr))
  const bigOvr = avg(ordered.filter((p) => p.pos === 'PF' || p.pos === 'C').map((p) => p.ovr))
  const meanOvr = avg(ordered.map((p) => p.ovr))
  const avgAge = avg(ordered.map((p) => p.age))
  const depthOvr = avg(ordered.slice(5, 9).map((p) => p.ovr)) || meanOvr
  const maxOvr = ordered.length ? Math.max(...ordered.map((p) => p.ovr)) : meanOvr
  const clampPct = (n: number): number => clampNum(Math.round(n), 0, 100)
  return {
    threePoint: clampPct(50 + (perimOvr - bigOvr) * 1.8),
    post: clampPct(50 + (bigOvr - perimOvr) * 1.8),
    pace: clampPct(50 + (28 - avgAge) * 3 + (depthOvr - 70) * 0.4),
    fastBreak: clampPct(50 + (28 - avgAge) * 2.5),
    defense: clampPct(50 + (meanOvr - 75) * 1.2),
    ballMovement: clampPct(60 - (maxOvr - meanOvr) * 2.5)
  }
}

// Incremental season-average update (`avg + (val-avg)/gp`) for every player
// who appears in a simulated game's box score — run for EVERY team after
// every game, not just the human's, so pts/reb/ast/stl/blk stay consistent
// with what the possession engine actually produced (rather than staying
// static preseason projections) and so CPU personnel tendencies (derived
// game plans) visibly show up in season stats. Freshly generated players
// keep their formula-seeded stats as a projection until `gp` starts moving.
export function accumulateSeasonStats(roster: RosterPlayer[], lines: PlayerGameLine[]): RosterPlayer[] {
  const byId = new Map(lines.map((l) => [l.id, l]))
  return roster.map((p) => {
    const l = byId.get(p.id)
    if (!l) return p
    const gp = (p.gp ?? 0) + 1
    const upd = (avg: number, val: number): number => Number((avg + (val - avg) / gp).toFixed(1))
    return {
      ...p,
      gp,
      pts: upd(p.pts, l.pts),
      reb: upd(p.reb, l.reb),
      ast: upd(p.ast, l.ast),
      stl: upd(p.stl ?? seedFlavorStl(p.pos, p.ovr), l.stl),
      blk: upd(p.blk ?? seedFlavorBlk(p.pos, p.ovr), l.blk)
    }
  })
}

export interface AllStarResult {
  boxScore: BoxScore
  mvp: string
}

// Pulls the league's best players (every real roster's top handful) into two
// squads — split East/West when the league has exactly two conferences, else
// alternating — and simulates one high-scoring exhibition game.
export function generateAllStarGame(
  teams: LeagueTeam[],
  myTeam: string,
  myRoster: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  dateStr: string
): AllStarResult {
  interface Candidate {
    player: RosterPlayer
    confIndex: number
  }
  const pool: Candidate[] = []
  const myConf = teams.find((t) => t.abbr === myTeam)?.confIndex ?? 0
  myRoster.forEach((p) => pool.push({ player: p, confIndex: myConf }))
  teams.forEach((t) => {
    if (t.abbr === myTeam) return
    ;(rosters[t.abbr] ?? [])
      .slice()
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 3)
      .forEach((p) => pool.push({ player: p, confIndex: t.confIndex }))
  })
  pool.sort((a, b) => b.player.ovr - a.player.ovr)
  const allStars = pool.slice(0, 24)

  const hasTwoConfs = new Set(teams.map((t) => t.confIndex)).size === 2
  const teamA: Candidate[] = []
  const teamB: Candidate[] = []
  allStars.forEach((c, i) => {
    const goA = hasTwoConfs ? c.confIndex === 0 : i % 2 === 0
    ;(goA ? teamA : teamB).push(c)
  })
  while (teamA.length > 12) teamB.push(teamA.pop()!)
  while (teamB.length > 12) teamA.push(teamB.pop()!)

  const rosterA = teamA.map((c) => c.player)
  const rosterB = teamB.map((c) => c.player)
  const lineupA = autoLineup(rosterA)
  const lineupB = autoLineup(rosterB)
  // Fixed high-scoring exhibition style for both squads — fast pace, heavy
  // 3PT volume, minimal defense, matching real All-Star Game conventions.
  const exhibitionPlan: GamePlanConfig = { pace: 100, threePoint: 65, post: 15, defense: 10, fastBreak: 85, ballMovement: 55 }
  const result = simulateGame(rosterA, lineupA, exhibitionPlan, rosterB, lineupB, exhibitionPlan, true)
  const won = result.home.pts >= result.away.pts

  const boxScore = toBoxScore(
    result,
    'home',
    'ASG-B',
    hasTwoConfs ? 'Team West' : 'Team B',
    '#1D428A',
    dateStr,
    won,
    hasTwoConfs ? 'Team East' : 'Team A',
    ACC
  )
  const mvpLine = [...result.home.players, ...result.away.players].sort((a, b) => b.pts - a.pts)[0]
  return { boxScore, mvp: mvpLine?.name ?? '' }
}

// ─────────────────────────────────────────────────────────────────────────
// Season calendar (unchanged from the previous round)
// ─────────────────────────────────────────────────────────────────────────

function circleMethodRounds(teamAbbrs: string[]): Array<Array<[string, string]>> {
  const arr = [...teamAbbrs]
  if (arr.length % 2 !== 0) arr.push('__BYE__')
  const n = arr.length
  const fixed = arr[0]
  let rotating = arr.slice(1)
  const rounds: Array<Array<[string, string]>> = []
  for (let r = 0; r < n - 1; r++) {
    const roundTeams = [fixed, ...rotating]
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const a = roundTeams[i]
      const b = roundTeams[n - 1 - i]
      if (a !== '__BYE__' && b !== '__BYE__') {
        pairs.push(r % 2 === 0 ? [a, b] : [b, a])
      }
    }
    rounds.push(pairs)
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)]
  }
  return rounds
}

export function generateSeasonCalendar(teams: LeagueTeam[], gamesPerSeason: number, startDate: SimDate): SeasonCalendar {
  const abbrs = teams.map((t) => t.abbr)
  if (abbrs.length < 2) return { games: [], allStarDay: 0, seasonEndDay: 0 }

  const baseRounds = circleMethodRounds(abbrs)
  const cyclesNeeded = Math.max(1, Math.ceil(gamesPerSeason / baseRounds.length))
  let allRounds: Array<Array<[string, string]>> = []
  for (let c = 0; c < cyclesNeeded; c++) {
    const flip = c % 2 === 1
    baseRounds.forEach((round) => {
      allRounds.push(flip ? round.map(([h, a]) => [a, h] as [string, string]) : round)
    })
  }
  allRounds = allRounds.slice(0, gamesPerSeason)

  const allStarRoundIdx = Math.round(allRounds.length * 0.6)
  const games: ScheduledGame[] = []
  let date = startDate
  let day = 0
  let allStarDay = 0
  let roundCursor = 0
  const totalDays = allRounds.length + 1

  for (let i = 0; i < totalDays; i++) {
    day++
    date = addDays(date, 1)
    if (roundCursor === allStarRoundIdx && allStarDay === 0) {
      allStarDay = day
      continue
    }
    const round = allRounds[roundCursor]
    roundCursor++
    if (!round) break
    round.forEach(([home, away]) => games.push({ day, date, home, away }))
  }

  return { games, allStarDay, seasonEndDay: day }
}

// The soonest Oct 21 strictly after `d` — NOT always "next calendar year".
// The regular season's game-dense schedule can wrap up well before October
// of the same year the Finals fall in, so blindly adding one year here would
// occasionally overshoot the actual next tip-off by a full extra year.
function nextOct21After(d: SimDate): SimDate {
  const dTime = new Date(d.y, d.m - 1, d.d).getTime()
  const sameYear: SimDate = { y: d.y, m: 10, d: 21 }
  // >= (not >): when `d` is already exactly next Oct 21 — the normal case
  // once the offseason calendar has fully played out — this must return
  // that same date rather than jumping an extra year ahead.
  if (new Date(sameYear.y, sameYear.m - 1, sameYear.d).getTime() >= dTime) return sameYear
  return { y: d.y + 1, m: 10, d: 21 }
}

// Milestones are fractions of the actual finals-end-to-tip-off span rather
// than fixed day counts — the sim's game-dense schedule means that span can
// run anywhere from ~90 days (finals conclude late) to ~150+ days (finals
// conclude early), and fixed offsets calibrated for one length can overshoot
// or crowd out the others at a different length. A 90-day floor keeps every
// milestone meaningfully spaced even in extreme edge cases.
export function generateOffseasonCalendar(seasonEndDate: SimDate): OffseasonCalendar {
  const seasonStart = nextOct21After(seasonEndDate)
  const msPerDay = 86_400_000
  const seasonStartDay = Math.max(
    90,
    Math.round(
      (new Date(seasonStart.y, seasonStart.m - 1, seasonStart.d).getTime() -
        new Date(seasonEndDate.y, seasonEndDate.m - 1, seasonEndDate.d).getTime()) /
        msPerDay
    )
  )
  const combineDay = Math.max(5, Math.round(seasonStartDay * 0.08))
  const draftDay = Math.max(combineDay + 5, Math.round(seasonStartDay * 0.35))
  const faOpenDay = draftDay + 4
  const trainingCampDay = Math.max(faOpenDay + 5, Math.round(seasonStartDay * 0.85))

  return {
    startDate: seasonEndDate,
    combineDay,
    draftDay,
    faOpenDay,
    trainingCampDay,
    seasonStartDay
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Draft
// ─────────────────────────────────────────────────────────────────────────

// Rolls which way (if any) a prospect's scouting report is wrong: 15% the
// report undersells them (sleeper — true value is better), 15% oversells
// them (bust — true value is worse), 70% honest read.
function rollVarianceType(): 'normal' | 'sleeper' | 'bust' {
  const roll = Math.random()
  if (roll < 0.15) return 'sleeper'
  if (roll < 0.3) return 'bust'
  return 'normal'
}

function seedScoutedOvrRange(ovr: number, varianceType: 'normal' | 'sleeper' | 'bust'): ScoutedRange {
  const widthHalf = 9 + Math.random() * 5
  let center = ovr
  if (varianceType === 'sleeper') center = ovr - (6 + Math.random() * 6)
  if (varianceType === 'bust') center = ovr + (6 + Math.random() * 6)
  return {
    lo: clampNum(Math.round(center - widthHalf), 30, 99),
    hi: clampNum(Math.round(center + widthHalf), 30, 99)
  }
}

function seedScoutedPotentialRange(potential: string, varianceType: 'normal' | 'sleeper' | 'bust'): [string, string] {
  const potIdx = POT.indexOf(potential)
  // Lower index = better grade, so a sleeper's perceived ceiling sits at a
  // *higher* (worse) index than the truth, and a bust's sits lower (better).
  let centerIdx = potIdx
  if (varianceType === 'sleeper') centerIdx = clampNum(potIdx + 1, 0, POT.length - 1)
  if (varianceType === 'bust') centerIdx = clampNum(potIdx - 1, 0, POT.length - 1)
  const idxWidth = 1 + Math.floor(Math.random() * 2)
  const loIdx = clampNum(centerIdx - idxWidth, 0, POT.length - 1)
  const hiIdx = clampNum(centerIdx + idxWidth, 0, POT.length - 1)
  return [POT[hiIdx], POT[loIdx]]
}

export function generateProspects(): DraftProspect[] {
  const POS = POSITIONS
  const COLL = [
    'Duke', 'Kentucky', 'Kansas', 'North Carolina', 'Arizona', 'UCLA', 'Michigan', 'Ohio State',
    'Gonzaga', 'Villanova', 'Syracuse', 'Texas', 'Louisville', 'Indiana', 'Connecticut'
  ]
  const used = new Set<string>()
  return Array(60)
    .fill(0)
    .map((_, i) => {
      let name: string
      do {
        name = `${FIRST_INITIALS[Math.floor(Math.random() * FIRST_INITIALS.length)]}. ${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]}`
      } while (used.has(name))
      used.add(name)
      const pos = POS[Math.floor((i * 1.2 + Math.random() * 3) % POS.length)]
      const age = 18 + Math.floor(Math.random() * 4)
      const tier = i < 5 ? 0 : i < 15 ? 1 : i < 30 ? 2 : 3
      const ovr = Math.max(63, Math.min(86, 87 - tier * 5 + Math.floor(Math.random() * 7 - 3)))
      const potIdx = Math.min(POT.length - 1, tier + Math.floor(Math.random() * 2))
      const potential = POT[potIdx]
      const origin = Math.random() < 0.7 ? COLL[Math.floor(Math.random() * COLL.length)] : 'International'
      const ppg = (ovr - 60) * 0.28 + Math.random() * 4
      const rpg = pos === 'C' || pos === 'PF' ? 6 + Math.random() * 5 : 2 + Math.random() * 4
      const apg = pos === 'PG' ? 4 + Math.random() * 4 : 1 + Math.random() * 3
      const varianceType = rollVarianceType()
      return {
        id: `p${i}`,
        rank: i + 1,
        name,
        pos,
        age,
        ovr,
        potential,
        origin,
        pts: ppg.toFixed(1),
        reb: rpg.toFixed(1),
        ast: apg.toFixed(1),
        drafted: false,
        draftTeam: null,
        draftPick: null,
        scoutedOvrRange: seedScoutedOvrRange(ovr, varianceType),
        scoutedPotentialRange: seedScoutedPotentialRange(potential, varianceType),
        scoutingProgress: 0,
        varianceType,
        combineRevealed: false
      }
    })
}

function generateMeasurables(pos: string, ovr: number): CombineMeasurables {
  const baseHeight = pos === 'C' ? 82 : pos === 'PF' ? 80 : pos === 'SF' ? 78 : pos === 'SG' ? 76 : 74
  const heightIn = Math.round(baseHeight + randRange(-2, 3))
  const wingspanIn = Math.round(heightIn + randRange(1, 5))
  const verticalIn = Math.round(clampNum(24 + (ovr - 65) * 0.35 + randRange(-4, 4), 20, 40))
  const sprintSec = Number(clampNum(3.4 - (ovr - 65) * 0.01 + randRange(-0.15, 0.15), 3.0, 3.9).toFixed(2))
  const drillLadder = ['D', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A']
  const drillGrade = drillLadder[clampNum(Math.round((ovr - 60) / 5), 0, drillLadder.length - 1)]
  return { heightIn, wingspanIn, verticalIn, sprintSec, drillGrade }
}

// Narrows a range's edges toward `target` by `step` (0-1 fraction of the
// remaining gap each edge closes this call) — used by both the combine (one
// modest pull toward the truth) and day-by-day scouting (repeated small
// pulls, so returns diminish as the range tightens).
function narrowToward(range: ScoutedRange, target: number, step: number): ScoutedRange {
  const lo = range.lo + (target - range.lo) * step
  const hi = range.hi + (target - range.hi) * step
  return { lo: Math.round(Math.min(lo, hi)), hi: Math.round(Math.max(lo, hi)) }
}

function narrowPotentialToward(range: [string, string], targetLabel: string, step: number): [string, string] {
  const targetIdx = POT.indexOf(targetLabel)
  const worstIdx = POT.indexOf(range[0])
  const bestIdx = POT.indexOf(range[1])
  const nextWorst = Math.round(worstIdx + (targetIdx - worstIdx) * step)
  const nextBest = Math.round(bestIdx + (targetIdx - bestIdx) * step)
  return [POT[Math.max(nextWorst, nextBest)], POT[Math.min(nextWorst, nextBest)]]
}

// Runs once, at the offseason's combine milestone: generates each prospect's
// physical measurables and gives every scouting report one modest pull
// toward the truth (bigger for 'normal' prospects, small for 'sleeper'/
// 'bust' — the whole point of those two is that the errored read persists).
export function runCombine(prospects: DraftProspect[]): DraftProspect[] {
  return prospects.map((p) => {
    const step = p.varianceType === 'normal' ? 0.5 : 0.2
    return {
      ...p,
      measurables: generateMeasurables(p.pos, p.ovr),
      combineRevealed: true,
      scoutedOvrRange: narrowToward(p.scoutedOvrRange, p.ovr, step),
      scoutedPotentialRange: narrowPotentialToward(p.scoutedPotentialRange, p.potential, step)
    }
  })
}

// Called once per simulated offseason day while scouting is open: spends the
// human's per-prospect effort allocation, narrowing that prospect's scouted
// range. 'normal' prospects narrow toward their true ovr/potential (fully
// converging as progress nears 100); 'sleeper'/'bust' prospects only ever
// narrow around their own (mis-centered) reading — scouting more just makes
// the wrong read feel more certain, it never self-corrects.
export function allocateScoutingEffort(prospects: DraftProspect[], allocations: Record<string, number>): DraftProspect[] {
  return prospects.map((p) => {
    const points = allocations[p.id] ?? 0
    if (points <= 0 || p.scoutingProgress >= 100) return p
    const gain = clampNum(points * (1 - p.scoutingProgress / 100) * 0.6, 0.5, 6)
    const scoutingProgress = clampNum(p.scoutingProgress + gain, 0, 100)
    const step = clampNum((gain / 100) * 2.2, 0, 1)

    if (p.varianceType === 'normal') {
      // Full scouting confidence (progress hitting 100) means the report
      // reads as the true value, not just "very narrow" — snap fully rather
      // than asymptotically approach it forever.
      const finalStep = scoutingProgress >= 100 ? 1 : step
      return {
        ...p,
        scoutingProgress,
        scoutedOvrRange: narrowToward(p.scoutedOvrRange, p.ovr, finalStep),
        scoutedPotentialRange: narrowPotentialToward(p.scoutedPotentialRange, p.potential, finalStep)
      }
    }
    // Non-normal: shrink toward the range's own midpoint, not the truth.
    const mid = (p.scoutedOvrRange.lo + p.scoutedOvrRange.hi) / 2
    const potMidIdx = Math.round((POT.indexOf(p.scoutedPotentialRange[0]) + POT.indexOf(p.scoutedPotentialRange[1])) / 2)
    return {
      ...p,
      scoutingProgress,
      scoutedOvrRange: narrowToward(p.scoutedOvrRange, mid, step),
      scoutedPotentialRange: narrowPotentialToward(p.scoutedPotentialRange, POT[potMidIdx], step)
    }
  })
}

export function runLotteryOrder(teams: LeagueTeam[], records: Record<string, TeamRecord>): string[] {
  const byR = teams
    .map((t) => ({ abbr: t.abbr, ...(records[t.abbr] ?? { w: 0, l: 0, l10: '0-0' }) }))
    .sort((a, b) => a.w - b.w || b.l - a.l)
  const lotteryCount = Math.min(14, byR.length)
  const lt = byR.slice(0, lotteryCount).map((t) => t.abbr)
  const baseOdds = [14, 13.4, 12.7, 12, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1, 0.5]
  const odds = lt.map((_, i) => baseOdds[i] ?? 0.5)
  const rem = [...lt]
  const remO = [...odds]
  const top4: string[] = []
  const drawCount = Math.min(4, rem.length)
  for (let i = 0; i < drawCount; i++) {
    const tot = remO.reduce((a, b) => a + b, 0)
    let r = Math.random() * tot
    let idx = 0
    while (r > remO[idx] && idx < remO.length - 1) {
      r -= remO[idx++]
    }
    top4.push(rem[idx])
    rem.splice(idx, 1)
    remO.splice(idx, 1)
  }
  const r1 = [...top4, ...rem, ...byR.slice(lotteryCount).map((t) => t.abbr).reverse()]
  return [...r1, ...[...r1].reverse()]
}

// ─────────────────────────────────────────────────────────────────────────
// Tradeable draft-pick ledger — a rolling 4-year window of pick assets, one
// 1st and one 2nd rounder per team per year. Pure ownership: no protections,
// no lottery-protected picks. `originalTeam` only ever determines draft
// POSITION (via that team's record when the draft year arrives); the pick
// actually goes to `currentOwner`.
// ─────────────────────────────────────────────────────────────────────────

export function resolvePickOwners(fullOrder: string[], pickAssets: DraftPickAsset[], year: number): string[] {
  const roundSize = fullOrder.length / 2
  return fullOrder.map((originalTeam, i) => {
    const round = Math.floor(i / roundSize) + 1
    const asset = pickAssets.find((a) => a.year === year && a.round === round && a.originalTeam === originalTeam)
    return asset ? asset.currentOwner : originalTeam
  })
}

// Drops the just-resolved year's assets and adds a fresh far-out year for
// every team, keeping the window's total size constant season over season.
export function rollDraftPickWindow(assets: DraftPickAsset[], resolvedYear: number, teams: LeagueTeam[]): DraftPickAsset[] {
  const remaining = assets.filter((a) => a.year !== resolvedYear)
  const newYear = (remaining.length ? Math.max(...remaining.map((a) => a.year)) : resolvedYear) + 1
  teams.forEach((t) => {
    ;[1, 2].forEach((round) => {
      remaining.push({ id: `${newYear}-${round}-${t.abbr}`, year: newYear, round, originalTeam: t.abbr, currentOwner: t.abbr })
    })
  })
  return remaining
}

export function pickLabel(pick: DraftPickAsset, teams: LeagueTeam[]): string {
  const base = `${pick.year} ${pick.round === 1 ? '1st' : '2nd'} Rd`
  if (pick.originalTeam === pick.currentOwner) return base
  const orig = teams.find((t) => t.abbr === pick.originalTeam)
  return `${base} (via ${orig?.city ?? pick.originalTeam})`
}

// CPU teams draft need-aware best-available (`scoreProspectForTeam`) instead
// of literally the first undrafted prospect. `slotOwners` (parallel to
// `fullOrder`, resolved once via `resolvePickOwners`) decides who actually
// drafts each slot; `fullOrder` itself only supplies `originalTeam` for the
// resulting `DraftPick` record, since a slot's owner can differ from whoever
// originally earned that draft position.
export function runInitialPicks(
  fullOrder: string[],
  slotOwners: string[],
  prospects: DraftProspect[],
  myTeam: string,
  rosters: Record<string, RosterPlayer[]>
): { picks: DraftPick[]; prospects: DraftProspect[]; currentPick: number } {
  const roundSize = fullOrder.length / 2
  const ps = [...prospects]
  const picks: DraftPick[] = []
  let pick = 0
  while (pick < slotOwners.length && slotOwners[pick] !== myTeam) {
    const ownerAbbr = slotOwners[pick]
    const originalAbbr = fullOrder[pick]
    const best = pickBestProspectForTeam(ps, rosters[ownerAbbr] ?? [])
    if (!best) break
    const idx = ps.indexOf(best)
    ps[idx] = { ...best, drafted: true, draftTeam: ownerAbbr, draftPick: pick + 1 }
    picks.push({
      pickNum: pick + 1,
      round: Math.floor(pick / roundSize) + 1,
      team: ownerAbbr,
      originalTeam: originalAbbr,
      prospect: { ...ps[idx] }
    })
    pick++
  }
  return { picks, prospects: ps, currentPick: pick }
}

// ─────────────────────────────────────────────────────────────────────────
// Playoffs (bracket mechanics unchanged; win probability now strength-based)
// ─────────────────────────────────────────────────────────────────────────

function bracketSeedOrder(n: number): number[] {
  let order = [1, 2]
  while (order.length < n) {
    const m = order.length * 2
    const next: number[] = []
    order.forEach((s) => {
      next.push(s)
      next.push(m + 1 - s)
    })
    order = next
  }
  return order
}

function firstRoundSeries(seeded: Array<{ abbr: string; seed: number }>, confIndex: number | null, gamesNeeded: number): PlayoffSeries[] {
  const order = bracketSeedOrder(seeded.length)
  const bySeed = new Map(seeded.map((t) => [t.seed, t]))
  const series: PlayoffSeries[] = []
  for (let i = 0; i < order.length; i += 2) {
    const a = bySeed.get(order[i])
    const b = bySeed.get(order[i + 1])
    if (!a || !b) continue
    series.push({
      id: `r0-${confIndex ?? 'all'}-${i / 2}`,
      round: 0,
      confIndex,
      teamA: a.abbr,
      teamB: b.abbr,
      seedA: a.seed,
      seedB: b.seed,
      winsA: 0,
      winsB: 0,
      gamesNeeded,
      winner: null
    })
  }
  return series
}

export function seedPlayoffBracket(teams: LeagueTeam[], records: Record<string, TeamRecord>, config: LeagueConfig): PlayoffBracket {
  const confIndexes = Array.from(new Set(teams.map((t) => t.confIndex))).sort((a, b) => a - b)
  const hasTwoConfs = confIndexes.length === 2
  const gamesNeeded = Math.ceil((config.roundGames[0] ?? 7) / 2)

  function seededTeamsForConf(confIndex: number | null): Array<{ abbr: string; seed: number }> {
    const pool = confIndex === null ? teams : teams.filter((t) => t.confIndex === confIndex)
    const sorted = pool
      .map((t) => ({ abbr: t.abbr, ...(records[t.abbr] ?? { w: 0, l: 0, l10: '0-0' }) }))
      .sort((a, b) => b.w - a.w || a.l - b.l)
    const n = Math.min(config.playoffTeamsPerConf, sorted.length)
    const bracketSize = Math.max(2, Math.pow(2, Math.ceil(Math.log2(Math.max(2, n)))))
    return sorted.slice(0, Math.min(bracketSize, sorted.length)).map((t, i) => ({ abbr: t.abbr, seed: i + 1 }))
  }

  const firstRound: PlayoffSeries[] = hasTwoConfs
    ? [...firstRoundSeries(seededTeamsForConf(0), 0, gamesNeeded), ...firstRoundSeries(seededTeamsForConf(1), 1, gamesNeeded)]
    : firstRoundSeries(seededTeamsForConf(null), null, gamesNeeded)

  return { rounds: [firstRound], champion: null }
}

export function advancePlayoffRound(bracket: PlayoffBracket, roundGames: number[]): PlayoffBracket {
  const currentRound = bracket.rounds[bracket.rounds.length - 1]
  if (!currentRound || !currentRound.every((s) => s.winner)) return bracket

  const byConf = new Map<string, PlayoffSeries[]>()
  currentRound.forEach((s) => {
    const key = String(s.confIndex)
    const arr = byConf.get(key) ?? []
    arr.push(s)
    byConf.set(key, arr)
  })
  const confKeys = Array.from(byConf.keys())
  const nextRoundIdx = bracket.rounds.length
  const gamesNeeded = Math.ceil((roundGames[Math.min(nextRoundIdx, roundGames.length - 1)] ?? 7) / 2)
  const winnersByConf = confKeys.map((k) =>
    byConf.get(k)!.map((s) => ({ winner: s.winner as string, seed: s.winner === s.teamA ? s.seedA : s.seedB }))
  )

  const nextSeries: PlayoffSeries[] = []
  const allSingleWinner = winnersByConf.every((w) => w.length === 1)

  if (confKeys.length > 1 && allSingleWinner) {
    const finalists = winnersByConf.map((w) => w[0])
    nextSeries.push({
      id: 'finals',
      round: nextRoundIdx,
      confIndex: null,
      teamA: finalists[0].winner,
      teamB: finalists[1].winner,
      seedA: finalists[0].seed,
      seedB: finalists[1].seed,
      winsA: 0,
      winsB: 0,
      gamesNeeded,
      winner: null
    })
  } else {
    confKeys.forEach((key, ci) => {
      const winners = winnersByConf[ci]
      for (let i = 0; i < winners.length; i += 2) {
        const a = winners[i]
        const b = winners[i + 1]
        if (!b) continue
        nextSeries.push({
          id: `r${nextRoundIdx}-${key}-${i / 2}`,
          round: nextRoundIdx,
          confIndex: key === 'null' ? null : Number(key),
          teamA: a.winner,
          teamB: b.winner,
          seedA: a.seed,
          seedB: b.seed,
          winsA: 0,
          winsB: 0,
          gamesNeeded,
          winner: null
        })
      }
    })
  }

  if (nextSeries.length === 0) {
    return { rounds: bracket.rounds, champion: currentRound[0]?.winner ?? null }
  }
  return { rounds: [...bracket.rounds, nextSeries], champion: null }
}

export interface PlayoffDayResult {
  bracket: PlayoffBracket
  myBoxScore: BoxScore | null
  myResult: { opp: string; won: boolean; myPts: number; oppPts: number } | null
}

export function simPlayoffDay(
  bracket: PlayoffBracket,
  teams: LeagueTeam[],
  myTeam: string,
  myRoster: RosterPlayer[],
  lineup: LineupState,
  gamePlan: GamePlanConfig,
  rosters: Record<string, RosterPlayer[]>,
  roundGames: number[]
): PlayoffDayResult {
  let myBoxScore: BoxScore | null = null
  let myResult: PlayoffDayResult['myResult'] = null

  function rosterOf(abbr: string): RosterPlayer[] {
    return abbr === myTeam ? myRoster : rosters[abbr] ?? []
  }
  function lineupOf(abbr: string): LineupState {
    return abbr === myTeam ? lineup : autoLineup(rosters[abbr] ?? [])
  }
  function gamePlanOf(abbr: string): GamePlanConfig {
    return abbr === myTeam ? gamePlan : deriveCpuGamePlan(rosterOf(abbr), lineupOf(abbr))
  }

  const currentRound = bracket.rounds[bracket.rounds.length - 1].map((s) => {
    if (s.winner) return s
    // No home-court edge in the playoffs (matches prior behavior) — neutral site.
    const result = simulateGame(
      rosterOf(s.teamA),
      lineupOf(s.teamA),
      gamePlanOf(s.teamA),
      rosterOf(s.teamB),
      lineupOf(s.teamB),
      gamePlanOf(s.teamB),
      true
    )
    const aWins = result.home.pts > result.away.pts
    const winner = aWins ? s.teamA : s.teamB
    const winsA = s.winsA + (aWins ? 1 : 0)
    const winsB = s.winsB + (aWins ? 0 : 1)
    const seriesDone = winsA >= s.gamesNeeded || winsB >= s.gamesNeeded

    if (s.teamA === myTeam || s.teamB === myTeam) {
      const myIsA = s.teamA === myTeam
      const myWon = myIsA ? aWins : !aWins
      const opp = myIsA ? s.teamB : s.teamA
      const myPts = myIsA ? result.home.pts : result.away.pts
      const oppPts = myIsA ? result.away.pts : result.home.pts
      myResult = { opp, won: myWon, myPts, oppPts }
      const td = teams.find((t) => t.abbr === opp)
      myBoxScore = toBoxScore(
        result,
        myIsA ? 'home' : 'away',
        opp,
        td ? `${td.city} ${td.name}` : opp,
        td?.primary ?? '#767672',
        'Playoffs',
        myWon
      )
    }

    return { ...s, winsA, winsB, winner: seriesDone ? winner : null }
  })

  let bracketWithRound: PlayoffBracket = { rounds: [...bracket.rounds.slice(0, -1), currentRound], champion: null }
  if (currentRound.every((s) => s.winner)) {
    bracketWithRound = advancePlayoffRound(bracketWithRound, roundGames)
  }
  return { bracket: bracketWithRound, myBoxScore, myResult }
}

// ─────────────────────────────────────────────────────────────────────────
// Regular season simulation — walks the calendar day by day; win probability
// is now driven by real team strength for every matchup, not just the
// human's. Also rolls dynamic injuries and periodic CPU-vs-CPU trades.
// ─────────────────────────────────────────────────────────────────────────

export interface SimDaysArgs {
  n: number
  teams: LeagueTeam[]
  records: Record<string, TeamRecord>
  rosters: Record<string, RosterPlayer[]>
  simDate: SimDate
  simDay: number
  calendar: SeasonCalendar
  myTeam: string
  myRoster: RosterPlayer[]
  lineup: LineupState
  gamePlan: GamePlanConfig
  pendingOffers: TradeOffer[]
  pickAssets: DraftPickAsset[]
  currentYear: number
}

export interface SimDaysResult {
  records: Record<string, TeamRecord>
  rosters: Record<string, RosterPlayer[]>
  myRoster: RosterPlayer[]
  simDate: SimDate
  simDay: number
  newResults: Array<{ opp: string; myPts: number; oppPts: number; won: boolean; d: number; m: number }>
  lastBoxScore: BoxScore | null
  newOffers: TradeOffer[]
  allStarResult: BoxScore | null
  allStarMvp: string | null
  seasonComplete: boolean
  newTransactions: TransactionEntry[]
  pickAssets: DraftPickAsset[]
}

function maybeInjure(roster: RosterPlayer[], playedIds: Set<number>, day: number): RosterPlayer[] {
  return roster.map((p) => {
    if (p.status !== 'Active' || !playedIds.has(p.id)) return p
    const ageRisk = p.age >= 32 ? 1.6 : p.age >= 28 ? 1.2 : 1.0
    if (Math.random() < 0.006 * ageRisk) {
      const severity = Math.random()
      const status: RosterPlayer['status'] = severity < 0.5 ? 'GTD' : severity < 0.85 ? 'INJ' : 'OUT'
      const outDays = status === 'GTD' ? 1 : status === 'INJ' ? 3 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 20)
      return { ...p, status, injuryReturnDay: day + outDays }
    }
    return p
  })
}

function clearHealed(roster: RosterPlayer[], day: number): RosterPlayer[] {
  return roster.map((p) => (p.injuryReturnDay !== undefined && day >= p.injuryReturnDay ? { ...p, status: 'Active', injuryReturnDay: undefined } : p))
}

// Finds a value-balanced 1-for-1 trade between two CPU teams with a real
// surplus/need mismatch. Returns null most of the time (fairness + need
// requirements are intentionally strict, matching how rarely real trades
// happen day-to-day). If the player-for-player value gap is too wide, tries
// sweetening the lower-value side with one of its own cheapest future
// (not-this-year) picks before giving up.
function findCpuTrade(
  rosters: Record<string, RosterPlayer[]>,
  teams: LeagueTeam[],
  myTeam: string,
  pickAssets: DraftPickAsset[],
  records: Record<string, TeamRecord>,
  myRoster: RosterPlayer[],
  currentYear: number
): { teamA: string; teamB: string; giveA: RosterPlayer; giveB: RosterPlayer; pickFromA?: DraftPickAsset; pickFromB?: DraftPickAsset } | null {
  const abbrs = teams.map((t) => t.abbr).filter((a) => a !== myTeam)
  if (abbrs.length < 2) return null
  const teamA = abbrs[Math.floor(Math.random() * abbrs.length)]
  const candidatesB = abbrs.filter((a) => a !== teamA)
  const teamB = candidatesB[Math.floor(Math.random() * candidatesB.length)]
  const rosterA = rosters[teamA] ?? []
  const rosterB = rosters[teamB] ?? []
  if (rosterA.length < 6 || rosterB.length < 6) return null

  const needA = weakestPosition(rosterA)
  const needB = weakestPosition(rosterB)
  const bDepthAtNeedA = rosterB.filter((p) => p.pos === needA).sort((a, b) => b.ovr - a.ovr)
  const aDepthAtNeedB = rosterA.filter((p) => p.pos === needB).sort((a, b) => b.ovr - a.ovr)
  if (bDepthAtNeedA.length < 2 || aDepthAtNeedB.length < 2) return null

  const giveB = bDepthAtNeedA[0]
  const giveA = aDepthAtNeedB[0]
  const valueA = playerValue(giveA)
  const valueB = playerValue(giveB)
  let pickFromA: DraftPickAsset | undefined
  let pickFromB: DraftPickAsset | undefined

  if (Math.abs(valueA - valueB) / Math.max(valueA, valueB, 1) > 0.35) {
    const ctx: PickValuationContext = { teams, records, rosters, myRoster, myTeam, currentYear }
    const deficitSide = valueA < valueB ? 'A' : 'B'
    const owner = deficitSide === 'A' ? teamA : teamB
    const candidates = pickAssets
      .filter((pk) => pk.currentOwner === owner && pk.year > currentYear)
      .sort((x, y) => pickValue(x, ctx) - pickValue(y, ctx))
    const candidate = candidates[0]
    if (!candidate) return null
    const sweetenedA = deficitSide === 'A' ? valueA + pickValue(candidate, ctx) : valueA
    const sweetenedB = deficitSide === 'B' ? valueB + pickValue(candidate, ctx) : valueB
    if (Math.abs(sweetenedA - sweetenedB) / Math.max(sweetenedA, sweetenedB, 1) > 0.35) return null
    if (deficitSide === 'A') pickFromA = candidate
    else pickFromB = candidate
  }

  return { teamA, teamB, giveA, giveB, pickFromA, pickFromB }
}

// Upgraded "CPU proposes a trade to the human" generator: targets the CPU
// team's real weakest position against the human's real roster, offering a
// value-comparable real player back (references real ids, per TradeOffer).
// 30% chance to also attach a draft pick — either sweetening the CPU's own
// offer with one of its cheap picks, or asking for one of the human's.
function generateCpuOfferToHuman(
  myRoster: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  teams: LeagueTeam[],
  myTeam: string,
  day: number,
  step: number,
  pickAssets: DraftPickAsset[],
  records: Record<string, TeamRecord>,
  currentYear: number
): TradeOffer | null {
  const others = teams.map((t) => t.abbr).filter((a) => a !== myTeam)
  if (others.length === 0) return null
  const fT = others[Math.floor(Math.random() * others.length)]
  const td = teams.find((t) => t.abbr === fT)
  const theirRoster = rosters[fT] ?? []
  if (!td || theirRoster.length < 6) return null

  const theirNeed = weakestPosition(theirRoster)
  const humanCandidates = myRoster.filter((p) => p.pos === theirNeed).sort((a, b) => b.ovr - a.ovr)
  const want = humanCandidates[Math.min(1, humanCandidates.length - 1)]
  if (!want) return null

  const wantValue = playerValue(want)
  const comp = [...theirRoster].sort((a, b) => Math.abs(playerValue(a) - wantValue) - Math.abs(playerValue(b) - wantValue))[0]
  if (!comp) return null

  const offer: TradeOffer = {
    id: `o${day}${step}${Math.random().toString(36).slice(2, 7)}`,
    fromTeam: fT,
    fromName: `${td.city} ${td.name}`,
    fromColor: td.primary,
    wantPlayerId: want.id,
    wantName: want.name,
    wantOvr: want.ovr,
    wantPos: want.pos,
    fromPlayerId: comp.id,
    offerName: comp.name,
    offerOvr: comp.ovr,
    offerPos: comp.pos
  }

  if (Math.random() < 0.3) {
    const ctx: PickValuationContext = { teams, records, rosters, myRoster, myTeam, currentYear }
    if (Math.random() < 0.5) {
      const own = pickAssets.filter((pk) => pk.currentOwner === fT).sort((a, b) => pickValue(a, ctx) - pickValue(b, ctx))
      if (own[0]) {
        offer.offerPickId = own[0].id
        offer.offerPickLabel = pickLabel(own[0], teams)
      }
    } else {
      const human = pickAssets.filter((pk) => pk.currentOwner === myTeam).sort((a, b) => pickValue(b, ctx) - pickValue(a, ctx))
      if (human[0]) {
        offer.wantPickId = human[0].id
        offer.wantPickLabel = pickLabel(human[0], teams)
      }
    }
  }

  return offer
}

export function simDays(args: SimDaysArgs): SimDaysResult {
  const { n, teams, records, simDate, calendar, myTeam, pendingOffers } = args
  const nextRecords: Record<string, TeamRecord> = {}
  teams.forEach((t) => (nextRecords[t.abbr] = { ...(records[t.abbr] ?? { w: 0, l: 0, l10: '0-0' }) }))
  const nextRosters: Record<string, RosterPlayer[]> = {}
  Object.entries(args.rosters).forEach(([abbr, roster]) => (nextRosters[abbr] = roster.map((p) => ({ ...p }))))
  let myRoster = args.myRoster.map((p) => ({ ...p }))

  let date = simDate
  let day = args.simDay
  const newResults: SimDaysResult['newResults'] = []
  let lastBoxScore: BoxScore | null = null
  let offers = [...pendingOffers]
  let allStarResult: BoxScore | null = null
  let allStarMvp: string | null = null
  let seasonComplete = false
  const newTransactions: TransactionEntry[] = []
  let pickAssets = [...args.pickAssets]

  const gamesByDay = new Map<number, ScheduledGame[]>()
  calendar.games.forEach((g) => {
    const arr = gamesByDay.get(g.day) ?? []
    arr.push(g)
    gamesByDay.set(g.day, arr)
  })

  function rosterOf(abbr: string): RosterPlayer[] {
    return abbr === myTeam ? myRoster : nextRosters[abbr] ?? []
  }
  function lineupOf(abbr: string): LineupState {
    return abbr === myTeam ? args.lineup : autoLineup(nextRosters[abbr] ?? [])
  }
  function setRosterOf(abbr: string, roster: RosterPlayer[]): void {
    if (abbr === myTeam) myRoster = roster
    else nextRosters[abbr] = roster
  }

  for (let step = 0; step < n; step++) {
    if (day >= calendar.seasonEndDay) {
      seasonComplete = true
      break
    }
    day++
    date = addDays(date, 1)

    if (day === calendar.allStarDay) {
      const as = generateAllStarGame(teams, myTeam, myRoster, nextRosters, `${date.m}/${date.d}`)
      allStarResult = as.boxScore
      allStarMvp = as.mvp
      continue
    }

    const todaysGames = gamesByDay.get(day) ?? []
    todaysGames.forEach((g) => {
      const hr = nextRecords[g.home]
      const ar = nextRecords[g.away]
      if (!hr || !ar) return
      const homeRosterNow = rosterOf(g.home)
      const awayRosterNow = rosterOf(g.away)
      const homeLineupNow = lineupOf(g.home)
      const awayLineupNow = lineupOf(g.away)
      const homeGamePlan = g.home === myTeam ? args.gamePlan : deriveCpuGamePlan(homeRosterNow, homeLineupNow)
      const awayGamePlan = g.away === myTeam ? args.gamePlan : deriveCpuGamePlan(awayRosterNow, awayLineupNow)
      const result = simulateGame(homeRosterNow, homeLineupNow, homeGamePlan, awayRosterNow, awayLineupNow, awayGamePlan, false)
      const homeWon = result.home.pts > result.away.pts
      const winT = homeWon ? g.home : g.away
      const loseT = homeWon ? g.away : g.home
      nextRecords[winT].w++
      nextRecords[loseT].l++

      setRosterOf(g.home, accumulateSeasonStats(homeRosterNow, result.home.players))
      setRosterOf(g.away, accumulateSeasonStats(awayRosterNow, result.away.players))

      if (g.home === myTeam || g.away === myTeam) {
        const myIsHome = g.home === myTeam
        const myWon = myIsHome ? homeWon : !homeWon
        const opp = myIsHome ? g.away : g.home
        const myPts = myIsHome ? result.home.pts : result.away.pts
        const oppPts = myIsHome ? result.away.pts : result.home.pts
        newResults.unshift({ opp, myPts, oppPts, won: myWon, d: date.d, m: date.m })
        const td = teams.find((t) => t.abbr === opp)
        lastBoxScore = toBoxScore(
          result,
          myIsHome ? 'home' : 'away',
          opp,
          td ? `${td.city} ${td.name}` : opp,
          td?.primary ?? '#767672',
          `${date.m}/${date.d}`,
          myWon
        )
      }

      // Dynamic injuries: only the players who actually logged minutes are at risk.
      const playedHome = new Set(result.home.players.filter((p) => p.min > 0).map((p) => p.id))
      const playedAway = new Set(result.away.players.filter((p) => p.min > 0).map((p) => p.id))
      setRosterOf(g.home, maybeInjure(rosterOf(g.home), playedHome, day))
      setRosterOf(g.away, maybeInjure(rosterOf(g.away), playedAway, day))
    })

    // Heal anyone whose return day has passed, league-wide, every day.
    myRoster = clearHealed(myRoster, day)
    Object.keys(nextRosters).forEach((abbr) => {
      nextRosters[abbr] = clearHealed(nextRosters[abbr], day)
    })

    // CPU-vs-CPU trade: small daily chance, executed immediately if found.
    if (Math.random() < 0.06) {
      const trade = findCpuTrade(nextRosters, teams, myTeam, pickAssets, nextRecords, myRoster, args.currentYear)
      if (trade) {
        nextRosters[trade.teamA] = [...nextRosters[trade.teamA].filter((p) => p.id !== trade.giveA.id), trade.giveB]
        nextRosters[trade.teamB] = [...nextRosters[trade.teamB].filter((p) => p.id !== trade.giveB.id), trade.giveA]
        let detail = `${teamLabel(teams, trade.teamB)} receives: ${trade.giveA.name}`
        if (trade.pickFromA) {
          pickAssets = pickAssets.map((pk) => (pk.id === trade.pickFromA!.id ? { ...pk, currentOwner: trade.teamB } : pk))
          detail += ` + ${pickLabel(trade.pickFromA, teams)}`
        }
        if (trade.pickFromB) {
          pickAssets = pickAssets.map((pk) => (pk.id === trade.pickFromB!.id ? { ...pk, currentOwner: trade.teamA } : pk))
        }
        newTransactions.push({
          id: `tx${day}${step}a`,
          type: 'TRADE',
          headline: `${teamLabel(teams, trade.teamA)} acquire ${trade.giveB.name}${trade.pickFromB ? ` + ${pickLabel(trade.pickFromB, teams)}` : ''} from ${teamLabel(teams, trade.teamB)}`,
          detail,
          date: `${date.m}/${date.d}/${date.y}`
        })
      }
    }

    // CPU-to-human trade offer: 15% chance per simulated day, capped at 4 pending.
    if (Math.random() < 0.15 && offers.length < 4) {
      const offer = generateCpuOfferToHuman(myRoster, nextRosters, teams, myTeam, day, step, pickAssets, nextRecords, args.currentYear)
      if (offer) offers = [...offers, offer].slice(0, 5)
    }
  }

  // CPU rosters otherwise only aged once per season (in advanceToNextSeason);
  // apply the same potential-driven progression the human roster gets via
  // runSim, at the same cadence, so the whole league ages consistently.
  Object.keys(nextRosters).forEach((abbr) => {
    nextRosters[abbr] = applyProgression(n, nextRosters[abbr]).roster
  })

  return {
    records: nextRecords,
    rosters: nextRosters,
    myRoster,
    simDate: date,
    simDay: day,
    newResults,
    lastBoxScore,
    newOffers: offers,
    allStarResult,
    allStarMvp,
    seasonComplete,
    newTransactions,
    pickAssets
  }
}

function offseasonPhaseForDay(day: number, cal: OffseasonCalendar, draftPhase: DraftPhase): OffseasonSubPhase {
  if (day < cal.draftDay || draftPhase !== 'complete') return day < cal.draftDay ? 'combine' : 'draft'
  if (day < cal.faOpenDay) return 'moratorium'
  if (day < cal.trainingCampDay) return 'freeAgency'
  return 'trainingCamp'
}

export interface SimOffseasonDaysArgs {
  n: number
  offseasonDay: number
  simDate: SimDate
  offseasonCalendar: OffseasonCalendar
  draftPhase: DraftPhase
  draftProspects: DraftProspect[] | null
  scoutingAllocations: Record<string, number>
  freeAgentPool: RosterPlayer[]
  rosters: Record<string, RosterPlayer[]>
  myRoster: RosterPlayer[]
  myTeam: string
  config: LeagueConfig
  freeAgentNegotiations: Record<number, FreeAgentNegotiation>
}

export interface SimOffseasonDaysResult {
  offseasonDay: number
  simDate: SimDate
  offseasonPhase: OffseasonSubPhase
  stoppedAt: OffseasonSubPhase | null
  readyForNextSeason: boolean
  draftProspects: DraftProspect[] | null
  freeAgentPool: RosterPlayer[]
  rosters: Record<string, RosterPlayer[]>
  myRoster: RosterPlayer[]
  freeAgentNegotiations: Record<number, FreeAgentNegotiation>
  newTransactions: TransactionEntry[]
}

// Day-by-day offseason clock, same early-stop idiom as simDays' seasonComplete
// flag: advances up to n days, but holds at the draft milestone until the
// human actually finishes drafting (draftPhase reaches 'complete'), same way
// a human is expected to manually work through DraftRoom rather than have it
// auto-resolve. Also drives the pre-draft scouting/combine window (spends the
// human's scouting allocation each day, runs the combine once) and the live
// free-agency negotiation window (CPU bids + daily resolution each day,
// then one final fill-remaining-needs pass at training camp).
export function simOffseasonDays(args: SimOffseasonDaysArgs): SimOffseasonDaysResult {
  const { n, offseasonCalendar: cal, draftPhase, scoutingAllocations, myTeam, config } = args
  let day = args.offseasonDay
  let date = args.simDate
  let stoppedAt: OffseasonSubPhase | null = null
  let prospects = args.draftProspects
  let pool = [...args.freeAgentPool]
  const rosters: Record<string, RosterPlayer[]> = {}
  Object.entries(args.rosters).forEach(([abbr, roster]) => (rosters[abbr] = [...roster]))
  let myRoster = [...args.myRoster]
  let negotiations = { ...args.freeAgentNegotiations }
  const newTransactions: TransactionEntry[] = []

  for (let step = 0; step < n; step++) {
    if (day >= cal.draftDay && draftPhase !== 'complete') {
      stoppedAt = 'draft'
      break
    }
    if (day >= cal.seasonStartDay) break
    day++
    date = addDays(date, 1)

    if (prospects && day < cal.draftDay) {
      prospects = allocateScoutingEffort(prospects, scoutingAllocations)
    }
    if (prospects && day === cal.combineDay) {
      prospects = runCombine(prospects)
    }

    if (day >= cal.faOpenDay && day < cal.trainingCampDay) {
      negotiations = generateCpuFreeAgentOffers(pool, rosters, negotiations, config, myTeam, day)
      const dayResult = resolveFreeAgentDay(negotiations, pool, rosters, myRoster, myTeam)
      negotiations = dayResult.negotiations
      pool = dayResult.freeAgentPool
      Object.assign(rosters, dayResult.rosters)
      myRoster = dayResult.myRoster
      dayResult.signings.forEach((s) => {
        newTransactions.push({
          id: `tx-fa-${day}-${s.player.id}`,
          type: 'SIGN',
          headline: `${s.team} sign ${s.player.name}`,
          detail: `${s.player.pos} · ${s.years}yr/${fmt$(s.annualSalary)}`,
          date: `${date.m}/${date.d}/${date.y}`
        })
      })
    }

    if (day === cal.trainingCampDay) {
      const faResult = simulateFreeAgencyPeriod(rosters, pool, config, myTeam)
      Object.assign(rosters, faResult.rosters)
      pool = faResult.freeAgentPool
      faResult.signings.forEach((s) => {
        newTransactions.push({
          id: `tx-camp-${day}-${s.player.id}`,
          type: 'SIGN',
          headline: `${s.team} sign ${s.player.name}`,
          detail: `${s.player.pos} · ${fmt$(s.player.salary)}/yr`,
          date: `${date.m}/${date.d}/${date.y}`
        })
      })
    }
  }

  return {
    offseasonDay: day,
    simDate: date,
    offseasonPhase: offseasonPhaseForDay(day, cal, draftPhase),
    stoppedAt,
    readyForNextSeason: day >= cal.seasonStartDay,
    draftProspects: prospects,
    freeAgentPool: pool,
    rosters,
    myRoster,
    freeAgentNegotiations: negotiations,
    newTransactions
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Progression, free agency, roster limits, and the offseason transition
// ─────────────────────────────────────────────────────────────────────────

export interface ProgressionResult {
  roster: RosterPlayer[]
  log: Array<{ name: string; change: string; color: string }>
}

// Real-NBA-shaped aging curve: growth is gated by how far a player sits below
// their potential ceiling (a plateaued player at ovr===potential never rolls
// growth), while decline is age-only — it comes for everyone regardless of
// talent. Only runs for week+ simulations — day-by-day sims are too short to
// move the needle on player development.
function growthBand(age: number): number {
  return age <= 23 ? 1.0 : age <= 29 ? 0.35 : age <= 32 ? 0.05 : 0
}
function declineBand(age: number): number {
  return age <= 23 ? 0 : age <= 29 ? 0.03 : age <= 32 ? 0.12 : 0.28
}

export function applyProgression(n: number, roster: RosterPlayer[]): ProgressionResult {
  if (n < 7) return { roster, log: [] }
  const mo = n / 30
  const log: ProgressionResult['log'] = []
  const next = roster.map((p) => {
    const gap = Math.max(0, p.potential - p.ovr)
    const growthChance = clampNum(growthBand(p.age) * (gap / 25) * mo, 0, 0.75)
    const declineChance = clampNum(declineBand(p.age) * mo, 0, 0.9)

    if (gap > 0 && Math.random() < growthChance) {
      const breakout = gap >= 8 && Math.random() < 0.15
      const newOvr = Math.min(p.potential, p.ovr + (breakout ? 2 : 1), 99)
      let newPotential = p.potential
      // Small headroom mechanic: a young player who caps out at their
      // projected ceiling can occasionally outgrow the scouting report.
      if (newOvr >= p.potential && p.age <= 25 && Math.random() < 0.05) {
        newPotential = Math.min(99, p.potential + 1)
      }
      log.unshift({ name: p.name, change: `OVR ${p.ovr}→${newOvr}`, color: 'oklch(0.45 0.18 140)' })
      return { ...p, ovr: newOvr, potential: newPotential }
    }
    if (Math.random() < declineChance) {
      log.unshift({ name: p.name, change: `OVR ${p.ovr}→${Math.max(40, p.ovr - 1)}`, color: '#CE1141' })
      return { ...p, ovr: Math.max(40, p.ovr - 1) }
    }
    return p
  })
  return { roster: next, log: log.slice(0, 15) }
}

// ─────────────────────────────────────────────────────────────────────────
// Free-agency negotiation — structured back-and-forth over the offseason's
// faOpenDay..trainingCampDay window: the human submits offers, CPU teams bid
// on the same players, and each simulated day ticks every open negotiation
// toward accept/counter/reject or a patience-exhausted auto-sign.
// ─────────────────────────────────────────────────────────────────────────

// Seeds (or reuses) the market read on a free agent the first time either
// side makes an offer — same random-band-around-asking-price idiom used
// throughout this file (see e.g. seedScoutedOvrRange above).
function seedMarketValue(existing: FreeAgentNegotiation | undefined, askingSalary: number): number {
  return existing?.marketValue ?? Math.round(askingSalary * (0.9 + Math.random() * 0.3))
}
function seedPatience(existing: FreeAgentNegotiation | undefined): number {
  return existing?.patience ?? 5 + Math.floor(Math.random() * 6)
}
function seedReSignBias(existing: FreeAgentNegotiation | undefined): number {
  return existing?.reSignBias ?? Math.random() * 0.15
}

// Human submits/revises an offer on a free agent — called by the
// makeFreeAgentOffer store action.
export function submitFreeAgentOffer(
  negotiations: Record<number, FreeAgentNegotiation>,
  player: RosterPlayer,
  years: number,
  annualSalary: number,
  myTeam: string,
  day: number
): Record<number, FreeAgentNegotiation> {
  const existing = negotiations[player.id]
  const myOffer: FreeAgentOffer = {
    id: `off_${player.id}_${day}_${Math.random().toString(36).slice(2, 7)}`,
    playerId: player.id,
    team: myTeam,
    years,
    annualSalary,
    submittedDay: day
  }
  return {
    ...negotiations,
    [player.id]: {
      playerId: player.id,
      myOffer,
      rivalOffers: existing?.rivalOffers ?? [],
      agentResponse: 'pending',
      agentMessage: 'Reviewing your offer…',
      patience: seedPatience(existing),
      marketValue: seedMarketValue(existing, player.salary),
      reSignBias: seedReSignBias(existing)
    }
  }
}

// Called once per simulated day during the FA window: a handful of CPU
// teams each consider bidding on the pool's best-fit-for-need player, same
// need/afford logic as the old instant simulateFreeAgencyPeriod batch below,
// but recorded as a visible rival offer instead of an instant signing.
export function generateCpuFreeAgentOffers(
  freeAgentPool: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  negotiations: Record<number, FreeAgentNegotiation>,
  config: LeagueConfig,
  myTeam: string,
  day: number
): Record<number, FreeAgentNegotiation> {
  const next = { ...negotiations }
  const capLimit = config.salaryCap * 1_000_000
  const biddingTeams = shuffle(Object.keys(rosters).filter((a) => a !== myTeam)).slice(0, 6)

  biddingTeams.forEach((abbr) => {
    if (Math.random() > 0.4) return // not every team bids every day
    const roster = rosters[abbr] ?? []
    if (roster.length >= 15) return
    const totalSalary = roster.reduce((a, p) => a + p.salary, 0)
    const capRoom = capLimit - totalSalary
    if (config.hardCap && capRoom <= 0) return
    const need = weakestPosition(roster)
    const affordable = freeAgentPool.filter((p) => !config.hardCap || p.salary <= capRoom)
    if (affordable.length === 0) return
    const target = affordable
      .map((p) => ({ p, score: playerValue(p) + (p.pos === need ? 8 : 0) }))
      .sort((a, b) => b.score - a.score)[0]?.p
    if (!target) return

    const existing = next[target.id]
    const marketValue = seedMarketValue(existing, target.salary)
    const years = 1 + Math.floor(Math.random() * 4)
    const annualSalary = Math.round(marketValue * (0.85 + Math.random() * 0.3))
    const offer: FreeAgentOffer = {
      id: `cpu_${target.id}_${abbr}_${day}`,
      playerId: target.id,
      team: abbr,
      years,
      annualSalary,
      submittedDay: day
    }
    const rivalOffers = [...(existing?.rivalOffers ?? []).filter((o) => o.team !== abbr), offer]
      .sort((a, b) => b.annualSalary - a.annualSalary)
      .slice(0, 3)

    next[target.id] = {
      playerId: target.id,
      myOffer: existing?.myOffer ?? null,
      rivalOffers,
      agentResponse: existing?.agentResponse ?? 'pending',
      agentMessage: existing?.agentMessage ?? '',
      patience: seedPatience(existing),
      marketValue,
      reSignBias: seedReSignBias(existing)
    }
  })
  return next
}

export interface FreeAgentDaySigning {
  team: string
  player: RosterPlayer
  years: number
  annualSalary: number
}

export interface FreeAgentDayResult {
  negotiations: Record<number, FreeAgentNegotiation>
  freeAgentPool: RosterPlayer[]
  rosters: Record<string, RosterPlayer[]>
  myRoster: RosterPlayer[]
  signings: FreeAgentDaySigning[]
}

// Daily tick for every open negotiation: decrements patience, decides
// accept/counter/reject by comparing the human's offer (lightly boosted by
// re-sign bias) against the best rival bid and the seeded market value, and
// finalizes a signing either on acceptance or once patience runs out (the
// best offer on the table wins, human or CPU).
export function resolveFreeAgentDay(
  negotiations: Record<number, FreeAgentNegotiation>,
  freeAgentPool: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  myRoster: RosterPlayer[],
  myTeam: string
): FreeAgentDayResult {
  let pool = [...freeAgentPool]
  const nextRosters: Record<string, RosterPlayer[]> = {}
  Object.entries(rosters).forEach(([abbr, roster]) => (nextRosters[abbr] = [...roster]))
  let nextMyRoster = [...myRoster]
  const nextNegotiations: Record<number, FreeAgentNegotiation> = {}
  const signings: FreeAgentDaySigning[] = []

  Object.values(negotiations).forEach((neg) => {
    const player = pool.find((p) => p.id === neg.playerId)
    if (!player) return

    const bestRival = neg.rivalOffers.slice().sort((a, b) => b.annualSalary - a.annualSalary)[0]
    const myBid = neg.myOffer ? neg.myOffer.annualSalary * (1 + neg.reSignBias) : 0
    const rivalBid = bestRival?.annualSalary ?? 0

    const patience = neg.patience - 1
    let agentResponse: AgentResponseKind = neg.agentResponse
    let agentMessage = neg.agentMessage
    let finalize: { team: string; offer: FreeAgentOffer } | null = null

    if (neg.myOffer && myBid >= neg.marketValue * 0.97 && myBid >= rivalBid) {
      finalize = { team: myTeam, offer: neg.myOffer }
      agentResponse = 'accepted'
      agentMessage = `${player.name} agrees to terms with your team.`
    } else if (neg.myOffer && rivalBid > myBid) {
      agentResponse = 'countered'
      agentMessage = `${bestRival!.team} offered ${bestRival!.years}yr/${fmt$(bestRival!.annualSalary)} — beat it or lose him.`
    } else if (neg.myOffer) {
      agentResponse = 'pending'
      agentMessage = 'Reviewing your offer…'
    }

    if (!finalize && patience <= 0) {
      const candidates = [...neg.rivalOffers, ...(neg.myOffer ? [neg.myOffer] : [])]
      const winner = candidates.sort((a, b) => b.annualSalary - a.annualSalary)[0]
      if (winner) {
        finalize = { team: winner.team, offer: winner }
        agentResponse = winner.team === myTeam ? 'accepted' : 'signedElsewhere'
        agentMessage = winner.team === myTeam ? `${player.name} agrees to terms with your team.` : `${player.name} signed elsewhere.`
      }
    }

    if (finalize) {
      const signedPlayer: RosterPlayer = { ...player, salary: finalize.offer.annualSalary, yrs: finalize.offer.years }
      if (finalize.team === myTeam) {
        nextMyRoster = [...nextMyRoster, signedPlayer]
      } else {
        nextRosters[finalize.team] = [...(nextRosters[finalize.team] ?? []), signedPlayer]
      }
      pool = pool.filter((p) => p.id !== player.id)
      signings.push({ team: finalize.team, player: signedPlayer, years: finalize.offer.years, annualSalary: finalize.offer.annualSalary })
      return
    }

    nextNegotiations[neg.playerId] = { ...neg, patience, agentResponse, agentMessage }
  })

  return { negotiations: nextNegotiations, freeAgentPool: pool, rosters: nextRosters, myRoster: nextMyRoster, signings }
}

export interface FreeAgencyResult {
  rosters: Record<string, RosterPlayer[]>
  freeAgentPool: RosterPlayer[]
  signings: Array<{ team: string; player: RosterPlayer }>
}

// Runs once, at the offseason's trainingCampDay, as a final "fill remaining
// bench needs from whatever's left in the pool" batch pass — the day-by-day
// negotiation above (submitFreeAgentOffer/generateCpuFreeAgentOffers/
// resolveFreeAgentDay) is what drives the actual FA window now.
export function simulateFreeAgencyPeriod(
  rosters: Record<string, RosterPlayer[]>,
  freeAgentPool: RosterPlayer[],
  config: LeagueConfig,
  myTeam: string
): FreeAgencyResult {
  const nextRosters: Record<string, RosterPlayer[]> = {}
  Object.entries(rosters).forEach(([abbr, roster]) => (nextRosters[abbr] = [...roster]))
  let pool = [...freeAgentPool]
  const signings: FreeAgencyResult['signings'] = []
  const capLimit = config.salaryCap * 1_000_000
  const teamAbbrs = shuffle(Object.keys(nextRosters).filter((a) => a !== myTeam))

  for (let round = 0; round < 3; round++) {
    for (const abbr of teamAbbrs) {
      if (pool.length === 0) break
      const roster = nextRosters[abbr]
      if (roster.length >= 15) continue
      const totalSalary = roster.reduce((a, p) => a + p.salary, 0)
      const capRoom = capLimit - totalSalary
      if (config.hardCap && capRoom <= 0) continue
      const need = weakestPosition(roster)
      const affordable = pool.filter((p) => !config.hardCap || p.salary <= capRoom)
      if (affordable.length === 0) continue
      const pick = affordable
        .map((p) => ({ p, score: playerValue(p) + (p.pos === need ? 8 : 0) }))
        .sort((a, b) => b.score - a.score)[0]?.p
      if (!pick) continue
      nextRosters[abbr] = [...roster, pick]
      pool = pool.filter((p) => p.id !== pick.id)
      signings.push({ team: abbr, player: pick })
    }
  }
  return { rosters: nextRosters, freeAgentPool: pool, signings }
}

export interface RosterLimitResult {
  rosters: Record<string, RosterPlayer[]>
  waiverPool: RosterPlayer[]
  cuts: Array<{ team: string; player: RosterPlayer }>
}

export function enforceRosterLimits(rosters: Record<string, RosterPlayer[]>, waiverPool: RosterPlayer[], limit = 15): RosterLimitResult {
  const nextRosters: Record<string, RosterPlayer[]> = {}
  const pool = [...waiverPool]
  const cuts: RosterLimitResult['cuts'] = []
  Object.entries(rosters).forEach(([abbr, roster]) => {
    if (roster.length <= limit) {
      nextRosters[abbr] = roster
      return
    }
    const sorted = [...roster].sort((a, b) => playerValue(b) - playerValue(a))
    nextRosters[abbr] = sorted.slice(0, limit)
    sorted.slice(limit).forEach((p) => {
      pool.push(p)
      cuts.push({ team: abbr, player: p })
    })
  })
  return { rosters: nextRosters, waiverPool: pool, cuts }
}

export interface NextSeasonResult {
  myRoster: RosterPlayer[]
  rosters: Record<string, RosterPlayer[]>
  freeAgentPool: RosterPlayer[]
  waiverPool: RosterPlayer[]
  records: Record<string, TeamRecord>
  calendar: SeasonCalendar
  seasonNumber: number
  lineup: LineupState
  nextPlayerId: number
  offseasonLog: TransactionEntry[]
  draftPickAssets: DraftPickAsset[]
}

// Offseason → next-season transition, for EVERY team: ages the roster (lets
// expiring contracts go to the free-agent pool), promotes each team's own
// draft picks onto its real roster, enforces roster limits, resets
// standings, regenerates the season calendar, and rolls the tradeable
// draft-pick window forward one year. Free agency itself no longer runs here
// — it's already resolved day-by-day (and via the trainingCampDay batch
// pass) by simOffseasonDays before this ever gets called, at seasonStartDay.
export function finalizeOffseasonToNextSeason(
  config: LeagueConfig,
  teams: LeagueTeam[],
  myRoster: RosterPlayer[],
  rosters: Record<string, RosterPlayer[]>,
  freeAgentPool: RosterPlayer[],
  waiverPool: RosterPlayer[],
  draftPicks: DraftPick[],
  myTeam: string,
  seasonNumber: number,
  seasonEndDate: SimDate,
  nextPlayerId: number,
  draftPickAssets: DraftPickAsset[],
  draftYear: number
): NextSeasonResult {
  let nextId = nextPlayerId
  const pool = [...freeAgentPool]

  function ageAndExpire(roster: RosterPlayer[]): RosterPlayer[] {
    // gp resets to 0 at season rollover — last season's real averages become
    // the new season's starting projection, then update again as games are played.
    const aged = roster.map((p) => ({ ...p, age: p.age + 1, yrs: p.yrs - 1, status: 'Active' as const, injuryReturnDay: undefined, gp: 0 }))
    const kept = aged.filter((p) => p.yrs > 0)
    aged.filter((p) => p.yrs <= 0).forEach((p) => pool.push(p))
    return applyProgression(30, kept).roster
  }

  function promotePicks(roster: RosterPlayer[], abbr: string): RosterPlayer[] {
    const picks = draftPicks.filter((p) => p.team === abbr)
    const next = [...roster]
    picks.forEach((pick) => {
      const pr = pick.prospect
      next.push({
        id: nextId++,
        name: pr.name,
        pos: pr.pos,
        age: pr.age,
        ovr: pr.ovr,
        pts: Number(pr.pts),
        reb: Number(pr.reb),
        ast: Number(pr.ast),
        salary: Math.round(800000 + pr.ovr * 40000),
        yrs: 3,
        status: 'Active',
        gp: 0,
        stl: seedFlavorStl(pr.pos, pr.ovr),
        blk: seedFlavorBlk(pr.pos, pr.ovr),
        potential: prospectPotential(pr.potential, pr.ovr)
      })
    })
    return next
  }

  const humanRoster = promotePicks(ageAndExpire(myRoster), myTeam)

  const agedCpuRosters: Record<string, RosterPlayer[]> = {}
  Object.entries(rosters).forEach(([abbr, roster]) => {
    agedCpuRosters[abbr] = promotePicks(ageAndExpire(roster), abbr)
  })

  const limitResult = enforceRosterLimits(agedCpuRosters, waiverPool)

  const records: Record<string, TeamRecord> = {}
  teams.forEach((t) => (records[t.abbr] = { w: 0, l: 0, l10: '0-0' }))

  const nextSeasonStart = nextOct21After(seasonEndDate)
  const calendar = generateSeasonCalendar(teams, config.gamesPerSeason, nextSeasonStart)
  const lineup = autoLineup(humanRoster)
  const nextDraftPickAssets = rollDraftPickWindow(draftPickAssets, draftYear, teams)

  return {
    myRoster: humanRoster,
    rosters: limitResult.rosters,
    freeAgentPool: pool,
    waiverPool: limitResult.waiverPool,
    records,
    calendar,
    seasonNumber: seasonNumber + 1,
    lineup,
    nextPlayerId: nextId,
    offseasonLog: [],
    draftPickAssets: nextDraftPickAssets
  }
}

export { NBA_TEAMS }
