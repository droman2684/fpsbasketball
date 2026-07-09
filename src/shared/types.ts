export interface TeamSeed {
  abbr: string
  name: string
  city: string
  conf: 'East' | 'West'
  div: string
  primary: string
  secondary: string
}

export interface FictionalTeam {
  id: string
  name: string
  city: string
  abbr: string
  primary: string
  secondary: string
}

export interface ConferenceConfig {
  name: string
  divisions: string[]
}

export interface LeagueConfig {
  leagueName: string
  teamsCount: number
  gamesPerSeason: number
  divsPerConf: 0 | 2 | 3
  conferences: ConferenceConfig[]
  selectedTeams: string[]
  fictionalTeams: FictionalTeam[]
  myTeam: string
  playoffTeamsPerConf: number
  roundGames: number[]
  salaryCap: number
  hardCap: boolean
}

export interface TeamRecord {
  w: number
  l: number
  l10: string
}

export interface RosterPlayer {
  id: number
  name: string
  pos: string
  age: number
  ovr: number
  pts: number
  reb: number
  ast: number
  salary: number
  yrs: number
  status: 'Active' | 'GTD' | 'OUT' | 'INJ'
  // Only set while status is 'OUT' or 'INJ' — the simDay the player becomes
  // Active again. Absent for healthy players.
  injuryReturnDay?: number
  // Games played this season — drives incremental averaging of pts/reb/ast/stl/blk.
  // Undefined/0 means the player hasn't taken the floor yet this season, so
  // pts/reb/ast/stl/blk still hold their formula-seeded preseason projection.
  gp?: number
  stl?: number
  blk?: number
  // Ceiling OVR (0-99, always >= ovr at seed time) — drives potential-gated
  // growth in applyProgression. See engine.ts's seedPotential/prospectPotential.
  potential: number
}

export interface SimResult {
  opp: string
  myPts: number
  oppPts: number
  won: boolean
  d: number
  m: number
}

export interface BoxScorePlayerLine {
  id?: number | string
  name: string
  pos: string
  min: number
  pts: number
  reb: number
  ast: number
  stl: number
  blk: number
  fgStr: string
  threeStr: string
  ftStr: string
  pm: string
}

export interface BoxScore {
  opp: string
  oppName: string
  oppColor: string
  // Only set for the All-Star Game, which has no real "my team" side —
  // when absent, callers derive the left-side name/color from TEAM_DATA[myTeam].
  myName?: string
  myColor?: string
  won: boolean
  myPts: number
  oppPts: number
  dateStr: string
  q1l: number
  q2l: number
  q3l: number
  q4l: number
  q1o: number
  q2o: number
  q3o: number
  q4o: number
  myPlayers: BoxScorePlayerLine[]
  oppPlayers: BoxScorePlayerLine[]
}

export interface DraftProspect {
  id: string
  rank: number
  name: string
  pos: string
  age: number
  ovr: number
  potential: string
  origin: string
  pts: string
  reb: string
  ast: string
  drafted: boolean
  draftTeam: string | null
  draftPick: number | null
}

export interface DraftPick {
  pickNum: number
  round: number
  // Who actually made this selection (the pick's current owner at draft time).
  team: string
  // Whose season record determined this slot's draft position — differs from
  // `team` when the pick was traded before the draft.
  originalTeam: string
  prospect: DraftProspect
}

// A future or upcoming draft-pick asset — exists independent of any live
// draft-in-progress, so it can be traded years before it's actually used.
// Pure ownership ledger: no protections, no lottery-protected picks.
export interface DraftPickAsset {
  id: string
  year: number
  round: number
  originalTeam: string
  currentOwner: string
}

export interface TradeOffer {
  id: string
  fromTeam: string
  fromName: string
  fromColor: string
  wantPlayerId: number
  wantName: string
  wantOvr: number
  wantPos: string
  fromPlayerId: number
  offerName: string
  offerOvr: number
  offerPos: string
  // Optional draft-pick pieces attached to the offer (either side).
  offerPickId?: string
  offerPickLabel?: string
  wantPickId?: string
  wantPickLabel?: string
}

export interface ProgressionEntry {
  name: string
  change: string
  color: string
}

export type DraftPhase = 'off' | 'lottery' | 'lotteryReveal' | 'board' | 'complete'

export interface RuleFlags {
  overtime: boolean
  challenge: boolean
  shotClock24: boolean
  loadMgmt: boolean
  playIn: boolean
  twoWay: boolean
}

export interface GamePlanConfig {
  pace: number
  threePoint: number
  post: number
  defense: number
  fastBreak: number
  ballMovement: number
}

export interface SimDate {
  y: number
  m: number
  d: number
}

export interface ScheduledGame {
  day: number
  date: SimDate
  home: string
  away: string
}

export interface SeasonCalendar {
  games: ScheduledGame[]
  allStarDay: number
  seasonEndDay: number
}

export interface PlayoffSeries {
  id: string
  round: number
  confIndex: number | null
  teamA: string
  teamB: string
  seedA: number
  seedB: number
  winsA: number
  winsB: number
  gamesNeeded: number
  winner: string | null
}

export interface PlayoffBracket {
  rounds: PlayoffSeries[][]
  champion: string | null
}

export interface LineupState {
  starters: number[]
  bench: number[]
}

export type TransactionType = 'TRADE' | 'SIGN' | 'WAIVE' | 'DRAFT' | 'EXPANSION'

export interface TransactionEntry {
  id: string
  type: TransactionType
  headline: string
  detail: string
  date: string
}

export type SeasonPhase = 'regular' | 'playoffs' | 'offseason'

export interface GameSnapshot {
  page: string
  conf: 'east' | 'west'
  simDate: SimDate
  simDay: number
  records: Record<string, TeamRecord>
  simResults: SimResult[]
  lastBoxScore: BoxScore | null
  rosterSort: string
  statCat: string
  tradeTeam: string
  tradeMyPicks: number[]
  tradeTheirPicks: number[]
  tradeMyPickAssets: string[]
  tradeTheirPickAssets: string[]
  gamePlan: GamePlanConfig
  devFocus: string[]
  scoutTeam: string
  ruleFlags: RuleFlags
  expCity: string
  expName: string
  expAbbr: string
  expConf: string
  expColor: string
  draftPhase: DraftPhase
  draftProspects: DraftProspect[] | null
  draftCurrentPick: number
  draftPicks: DraftPick[]
  draftFullOrder: string[]
  draftSlotOwners: string[]
  draftPickAssets: DraftPickAsset[]
  draftYear: number
  pendingOffers: TradeOffer[]
  progressionLog: ProgressionEntry[]
  myRoster: RosterPlayer[]
  myTeam: string
  leagueTeams: LeagueTeamSeed[]
  calendar: SeasonCalendar
  seasonNumber: number
  seasonPhase: SeasonPhase
  playoffs: PlayoffBracket | null
  lineup: LineupState
  allStarResult: BoxScore | null
  allStarMvp: string | null
  transactions: TransactionEntry[]
  lotteryRevealOrder: string[] | null
  lotteryRevealedCount: number
  rosters: Record<string, RosterPlayer[]>
  freeAgentPool: RosterPlayer[]
  waiverPool: RosterPlayer[]
  nextPlayerId: number
}

export interface LeagueTeamSeed {
  abbr: string
  city: string
  name: string
  primary: string
  secondary: string
  confIndex: number
}

export interface PersistedSave {
  id: string
  version: 1
  savedAt: string
  league: LeagueConfig
  game: GameSnapshot
}
