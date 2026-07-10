import { create } from 'zustand'
import {
  applyProgression,
  autoLineup,
  buildLeagueTeams,
  cloneMyRosterTemplate,
  evaluateTradeForTeam,
  finalizeOffseasonToNextSeason as advanceToNextSeasonEngine,
  generateOneRoster,
  generatePlayerPool,
  generateOffseasonCalendar,
  generateProspects,
  generateSeasonCalendar,
  genLeagueRosters,
  pickBestProspectForTeam,
  pickLabel,
  playerValue,
  resolvePickOwners,
  runInitialPicks,
  runLotteryOrder,
  seedPlayoffBracket,
  simDays as simDaysEngine,
  simOffseasonDays as simOffseasonDaysEngine,
  simPlayoffDay as simPlayoffDayEngine,
  submitFreeAgentOffer as submitFreeAgentOfferEngine,
  type LeagueTeam,
  type PickValuationContext
} from '@renderer/data/engine'
import { TEAM_DATA } from '@renderer/data/teams'
import type {
  BoxScore,
  DraftPhase,
  DraftPick,
  DraftPickAsset,
  DraftProspect,
  FreeAgentNegotiation,
  GamePlanConfig,
  GameSnapshot,
  LeagueConfig,
  LineupState,
  OffseasonCalendar,
  OffseasonSubPhase,
  PlayoffBracket,
  ProgressionEntry,
  RosterPlayer,
  RuleFlags,
  SeasonCalendar,
  SeasonPhase,
  SimDate,
  SimResult,
  TeamRecord,
  TradeOffer,
  TransactionEntry,
  TransactionType
} from '@shared/types'

export type NavDropdown = 'gm' | 'coach' | 'league' | 'comm' | null

interface GameState {
  initialized: boolean
  config: LeagueConfig | null
  // Stable identity for this league's save entry — generated once at
  // initGame/load time, carried through every autosave to the same slot.
  saveId: string
  myTeam: string
  myRoster: RosterPlayer[]
  rosters: Record<string, RosterPlayer[]>
  leagueTeams: LeagueTeam[]
  nextPlayerId: number
  freeAgentPool: RosterPlayer[]
  waiverPool: RosterPlayer[]

  page: string
  openDropdown: NavDropdown
  conf: 0 | 1

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
  lotteryRevealOrder: string[] | null
  lotteryRevealedCount: number
  scoutingAllocations: Record<string, number>
  freeAgentNegotiations: Record<number, FreeAgentNegotiation>

  pendingOffers: TradeOffer[]
  progressionLog: ProgressionEntry[]

  calendar: SeasonCalendar
  seasonNumber: number
  seasonPhase: SeasonPhase
  offseasonCalendar: OffseasonCalendar | null
  offseasonDay: number
  offseasonPhase: OffseasonSubPhase | null
  playoffs: PlayoffBracket | null
  lineup: LineupState
  allStarResult: BoxScore | null
  allStarMvp: string | null
  transactions: TransactionEntry[]

  initGame: (config: LeagueConfig) => void
  goToPage: (page: string) => void
  goHome: () => void
  // Exits back to the landing/load-league screen without quitting the app.
  // Non-destructive — the current league is already autosaved continuously,
  // so nothing is lost; it's just a navigation switch back to WizardRoot.
  returnToMenu: () => void
  setOpenDropdown: (d: NavDropdown) => void
  setConf: (c: 0 | 1) => void

  setRosterSort: (key: string) => void
  setStatCat: (key: string) => void
  setTradeTeam: (abbr: string) => void
  toggleMyTradePick: (id: number) => void
  toggleTheirTradePick: (id: number) => void
  toggleMyTradePickAsset: (id: string) => void
  toggleTheirTradePickAsset: (id: string) => void
  sendTrade: () => boolean
  setGamePlanField: (key: keyof GamePlanConfig, value: number) => void
  setDevFocus: (idx: number, focus: string) => void
  setScoutTeam: (abbr: string) => void
  toggleRule: (key: keyof RuleFlags) => void
  setExpField: (field: 'expCity' | 'expName' | 'expAbbr' | 'expConf' | 'expColor', value: string) => void
  addExpansionTeam: () => boolean

  swapStarter: (slotIndex: number, benchPlayerId: number) => void
  moveBenchPlayer: (playerId: number, direction: 'up' | 'down') => void

  makeFreeAgentOffer: (playerId: number, years: number, annualSalary: number) => boolean
  acceptCounterOffer: (playerId: number) => void
  withdrawFreeAgentOffer: (playerId: number) => void
  claimWaiver: (playerId: number) => boolean

  simDay1: () => void
  simWeek1: () => void
  simMonth1: () => void
  simPlayoffs1Day: () => void
  simOffseasonDay1: () => void
  simOffseasonWeek1: () => void
  simOffseasonMonth1: () => void
  startNextSeason: () => void

  initDraft: () => void
  runLottery: () => void
  revealNextLotteryPick: () => void
  skipLotteryReveal: () => void
  draftPlayer: (id: string) => void
  setScoutingAllocation: (prospectId: string, points: number) => void

  acceptOffer: (id: string) => void
  declineOffer: (id: string) => void

  loadSnapshot: (snap: GameSnapshot) => void
}

function defaultGamePlan(): GamePlanConfig {
  return { pace: 65, threePoint: 48, post: 32, defense: 72, fastBreak: 58, ballMovement: 64 }
}

function defaultRuleFlags(): RuleFlags {
  return { overtime: true, challenge: true, shotClock24: true, loadMgmt: false, playIn: true, twoWay: true }
}

const SEASON_START: SimDate = { y: 2026, m: 10, d: 21 }
const INITIAL_FA_POOL_SIZE = 24
const PICK_WINDOW_YEARS = 4

function teamLabel(abbr: string, teams: LeagueTeam[]): string {
  const t = teams.find((x) => x.abbr === abbr)
  return t ? `${t.city} ${t.name}` : abbr
}

// Builds a fresh rolling window of pick assets (1st + 2nd rounder per team
// per year, `currentOwner` starting as `originalTeam`) — used at league
// creation and by the save-migration backfill for old saves.
function seedDraftPickWindow(teams: LeagueTeam[], startYear: number, years: number): DraftPickAsset[] {
  const assets: DraftPickAsset[] = []
  for (let yOffset = 0; yOffset < years; yOffset++) {
    const year = startYear + yOffset
    teams.forEach((t) => {
      ;[1, 2].forEach((round) => {
        assets.push({ id: `${year}-${round}-${t.abbr}`, year, round, originalTeam: t.abbr, currentOwner: t.abbr })
      })
    })
  }
  return assets
}

// Old saves predate `potential` — any player missing it stops growing but
// never breaks (treated as already at their current ceiling).
function backfillPotential(roster: RosterPlayer[]): RosterPlayer[] {
  return roster.map((p) => (typeof p.potential === 'number' ? p : { ...p, potential: p.ovr }))
}

function nextRosterId(roster: RosterPlayer[]): number {
  return roster.reduce((max, p) => Math.max(max, p.id), 0) + 1
}

let txCounter = 0
function makeTransaction(type: TransactionType, headline: string, detail: string, simDate: SimDate): TransactionEntry {
  txCounter += 1
  return {
    id: `tx${simDate.y}${simDate.m}${simDate.d}_${txCounter}`,
    type,
    headline,
    detail,
    date: `${simDate.m}/${simDate.d}/${simDate.y}`
  }
}

// Removes a player from the lineup and files them back onto the bench,
// keeping starters always exactly 5 (backfilling from the front of the bench
// queue) — used whenever a roster change (trade/sign/waive) might otherwise
// leave a stale player id in the lineup or a starter slot empty.
function reconcileLineup(lineup: LineupState, roster: RosterPlayer[], addedIds: number[] = []): LineupState {
  const validIds = new Set(roster.map((p) => p.id))
  const starters = lineup.starters.filter((id) => validIds.has(id))
  const bench = [...lineup.bench.filter((id) => validIds.has(id)), ...addedIds.filter((id) => validIds.has(id))]
  while (starters.length < 5 && bench.length > 0) {
    starters.push(bench.shift()!)
  }
  return { starters, bench }
}

function runSim(n: number, get: () => GameState, set: (partial: Partial<GameState>) => void): void {
  const s = get()
  if (s.seasonPhase !== 'regular') return
  const result = simDaysEngine({
    n,
    teams: s.leagueTeams,
    records: s.records,
    rosters: s.rosters,
    simDate: s.simDate,
    simDay: s.simDay,
    calendar: s.calendar,
    myTeam: s.myTeam,
    myRoster: s.myRoster,
    lineup: s.lineup,
    gamePlan: s.gamePlan,
    pendingOffers: s.pendingOffers,
    pickAssets: s.draftPickAssets,
    currentYear: s.draftYear
  })
  const { roster, log } = applyProgression(n, result.myRoster)
  const patch: Partial<GameState> = {
    records: result.records,
    rosters: result.rosters,
    simDate: result.simDate,
    simDay: result.simDay,
    simResults: [...result.newResults, ...s.simResults].slice(0, 10),
    lastBoxScore: result.lastBoxScore ?? s.lastBoxScore,
    pendingOffers: result.newOffers,
    myRoster: roster,
    progressionLog: [...log, ...s.progressionLog].slice(0, 15),
    draftPickAssets: result.pickAssets
  }
  if (result.newTransactions.length > 0) {
    patch.transactions = [...result.newTransactions, ...s.transactions].slice(0, 50)
  }
  if (result.allStarResult) {
    patch.allStarResult = result.allStarResult
    patch.allStarMvp = result.allStarMvp
  }
  if (result.seasonComplete && s.config) {
    patch.seasonPhase = 'playoffs'
    patch.playoffs = seedPlayoffBracket(s.leagueTeams, result.records, s.config)
  }
  set(patch)
}

function runOffseasonSim(n: number, get: () => GameState, set: (partial: Partial<GameState>) => void): void {
  const s = get()
  if (s.seasonPhase !== 'offseason' || !s.offseasonCalendar || !s.config) return
  const result = simOffseasonDaysEngine({
    n,
    offseasonDay: s.offseasonDay,
    simDate: s.simDate,
    offseasonCalendar: s.offseasonCalendar,
    draftPhase: s.draftPhase,
    draftProspects: s.draftProspects,
    scoutingAllocations: s.scoutingAllocations,
    freeAgentPool: s.freeAgentPool,
    rosters: s.rosters,
    myRoster: s.myRoster,
    myTeam: s.myTeam,
    config: s.config,
    freeAgentNegotiations: s.freeAgentNegotiations
  })
  const patch: Partial<GameState> = {
    offseasonDay: result.offseasonDay,
    simDate: result.simDate,
    offseasonPhase: result.offseasonPhase,
    draftProspects: result.draftProspects,
    freeAgentPool: result.freeAgentPool,
    rosters: result.rosters,
    myRoster: result.myRoster,
    freeAgentNegotiations: result.freeAgentNegotiations
  }
  if (result.newTransactions.length > 0) {
    patch.transactions = [...result.newTransactions, ...s.transactions].slice(0, 50)
  }
  // Apply this tick's results first — startNextSeason (below) reads fresh
  // state via get(), so it must see the roster/pool changes from this same
  // tick (e.g. a trainingCampDay batch fill) rather than stale pre-tick state.
  set(patch)
  if (result.readyForNextSeason) {
    get().startNextSeason()
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  initialized: false,
  config: null,
  saveId: '',
  myTeam: 'LAL',
  myRoster: [],
  rosters: {},
  leagueTeams: [],
  nextPlayerId: 1,
  freeAgentPool: [],
  waiverPool: [],

  page: 'home',
  openDropdown: null,
  conf: 0,

  simDate: SEASON_START,
  simDay: 0,
  records: {},
  simResults: [],
  lastBoxScore: null,

  rosterSort: 'ovr',
  statCat: 'pts',
  tradeTeam: '',
  tradeMyPicks: [],
  tradeTheirPicks: [],
  tradeMyPickAssets: [],
  tradeTheirPickAssets: [],
  gamePlan: defaultGamePlan(),
  devFocus: ['shooting', 'iq', 'defense', 'passing'],
  scoutTeam: '',
  ruleFlags: defaultRuleFlags(),
  expCity: '',
  expName: '',
  expAbbr: '',
  expConf: 'East',
  expColor: '#1D428A',

  draftPhase: 'off',
  draftProspects: null,
  draftCurrentPick: 0,
  draftPicks: [],
  draftFullOrder: [],
  draftSlotOwners: [],
  draftPickAssets: [],
  draftYear: SEASON_START.y + 1,
  lotteryRevealOrder: null,
  lotteryRevealedCount: 0,
  scoutingAllocations: {},
  freeAgentNegotiations: {},

  pendingOffers: [],
  progressionLog: [],

  calendar: { games: [], allStarDay: 0, seasonEndDay: 0 },
  seasonNumber: 1,
  seasonPhase: 'regular',
  offseasonCalendar: null,
  offseasonDay: 0,
  offseasonPhase: null,
  playoffs: null,
  lineup: { starters: [], bench: [] },
  allStarResult: null,
  allStarMvp: null,
  transactions: [],

  initGame: (config) => {
    const leagueTeams = buildLeagueTeams(config)
    const records: Record<string, TeamRecord> = {}
    leagueTeams.forEach((t) => (records[t.abbr] = { w: 0, l: 0, l10: '0-0' }))
    const myConf = leagueTeams.find((t) => t.abbr === config.myTeam)?.confIndex ?? 0
    const myRoster = cloneMyRosterTemplate()
    let nextId = nextRosterId(myRoster) + 1000 // headroom so CPU-generated ids never collide with the human template
    const { rosters, nextId: afterRosters } = genLeagueRosters(leagueTeams, config.myTeam, nextId)
    nextId = afterRosters
    const usedNames = new Set<string>(Object.values(rosters).flat().map((p) => p.name))
    const { pool: freeAgentPool, nextId: afterPool } = generatePlayerPool(INITIAL_FA_POOL_SIZE, nextId, usedNames)
    nextId = afterPool
    const calendar = generateSeasonCalendar(leagueTeams, config.gamesPerSeason, SEASON_START)
    const lineup = autoLineup(myRoster)
    const draftYear0 = SEASON_START.y + 1
    const draftPickAssets = seedDraftPickWindow(leagueTeams, draftYear0, PICK_WINDOW_YEARS)
    set({
      initialized: true,
      config,
      saveId: crypto.randomUUID(),
      myTeam: config.myTeam,
      myRoster,
      rosters,
      leagueTeams,
      nextPlayerId: nextId,
      freeAgentPool,
      waiverPool: [],
      page: 'home',
      openDropdown: null,
      conf: myConf === 1 ? 1 : 0,
      simDate: SEASON_START,
      simDay: 0,
      records,
      simResults: [],
      lastBoxScore: null,
      rosterSort: 'ovr',
      statCat: 'pts',
      tradeTeam: leagueTeams.find((t) => t.abbr !== config.myTeam)?.abbr ?? '',
      tradeMyPicks: [],
      tradeTheirPicks: [],
      tradeMyPickAssets: [],
      tradeTheirPickAssets: [],
      gamePlan: defaultGamePlan(),
      devFocus: ['shooting', 'iq', 'defense', 'passing'],
      scoutTeam: leagueTeams.find((t) => t.abbr !== config.myTeam)?.abbr ?? '',
      ruleFlags: defaultRuleFlags(),
      expCity: '',
      expName: '',
      expAbbr: '',
      expConf: 'East',
      expColor: '#1D428A',
      draftPhase: 'off',
      draftProspects: null,
      draftCurrentPick: 0,
      draftPicks: [],
      draftFullOrder: [],
      draftSlotOwners: [],
      draftPickAssets,
      draftYear: draftYear0,
      lotteryRevealOrder: null,
      lotteryRevealedCount: 0,
      scoutingAllocations: {},
      freeAgentNegotiations: {},
      pendingOffers: [],
      progressionLog: [],
      calendar,
      seasonNumber: 1,
      seasonPhase: 'regular',
      offseasonCalendar: null,
      offseasonDay: 0,
      offseasonPhase: null,
      playoffs: null,
      lineup,
      allStarResult: null,
      allStarMvp: null,
      transactions: []
    })
  },

  goToPage: (page) => set({ page, openDropdown: null }),
  goHome: () => set({ page: 'home', openDropdown: null }),
  returnToMenu: () => set({ initialized: false }),
  setOpenDropdown: (d) => set({ openDropdown: d }),
  setConf: (c) => set({ conf: c }),

  setRosterSort: (key) => set({ rosterSort: key }),
  setStatCat: (key) => set({ statCat: key }),
  setTradeTeam: (abbr) => set({ tradeTeam: abbr, tradeTheirPicks: [], tradeTheirPickAssets: [] }),
  toggleMyTradePick: (id) =>
    set((s) => ({
      tradeMyPicks: s.tradeMyPicks.includes(id) ? s.tradeMyPicks.filter((x) => x !== id) : [...s.tradeMyPicks, id]
    })),
  toggleTheirTradePick: (id) =>
    set((s) => ({
      tradeTheirPicks: s.tradeTheirPicks.includes(id) ? s.tradeTheirPicks.filter((x) => x !== id) : [...s.tradeTheirPicks, id]
    })),
  toggleMyTradePickAsset: (id) =>
    set((s) => ({
      tradeMyPickAssets: s.tradeMyPickAssets.includes(id) ? s.tradeMyPickAssets.filter((x) => x !== id) : [...s.tradeMyPickAssets, id]
    })),
  toggleTheirTradePickAsset: (id) =>
    set((s) => ({
      tradeTheirPickAssets: s.tradeTheirPickAssets.includes(id)
        ? s.tradeTheirPickAssets.filter((x) => x !== id)
        : [...s.tradeTheirPickAssets, id]
    })),

  // A real, two-sided swap against the CPU team's actual persisted roster —
  // and the CPU genuinely evaluates whether it's a fair deal before agreeing.
  // Valid with players, picks, or both on either side.
  sendTrade: () => {
    const s = get()
    const hasSelection = s.tradeMyPicks.length || s.tradeTheirPicks.length || s.tradeMyPickAssets.length || s.tradeTheirPickAssets.length
    if (!hasSelection) return false
    const theirRoster = s.rosters[s.tradeTeam] ?? []
    const incoming = s.tradeTheirPicks.map((id) => theirRoster.find((p) => p.id === id)).filter((p): p is RosterPlayer => !!p)
    const outgoing = s.myRoster.filter((p) => s.tradeMyPicks.includes(p.id))
    const incomingPicks = s.draftPickAssets.filter((a) => s.tradeTheirPickAssets.includes(a.id))
    const outgoingPicks = s.draftPickAssets.filter((a) => s.tradeMyPickAssets.includes(a.id))
    if (incoming.length + incomingPicks.length === 0 || outgoing.length + outgoingPicks.length === 0) return false

    const ctx: PickValuationContext = {
      teams: s.leagueTeams,
      records: s.records,
      rosters: s.rosters,
      myRoster: s.myRoster,
      myTeam: s.myTeam,
      currentYear: s.draftYear
    }
    // CPU's incoming = human's outgoing.
    if (!evaluateTradeForTeam(outgoing, incoming, outgoingPicks, incomingPicks, ctx)) return false

    const myRemaining = s.myRoster.filter((p) => !s.tradeMyPicks.includes(p.id))
    const theirRemaining = theirRoster.filter((p) => !s.tradeTheirPicks.includes(p.id))
    const newMyRoster = [...myRemaining, ...incoming]
    const newTheirRoster = [...theirRemaining, ...outgoing]
    const lineup = reconcileLineup(s.lineup, newMyRoster, incoming.map((p) => p.id))
    const newPickAssets = s.draftPickAssets.map((a) => {
      if (incomingPicks.some((p) => p.id === a.id)) return { ...a, currentOwner: s.myTeam }
      if (outgoingPicks.some((p) => p.id === a.id)) return { ...a, currentOwner: s.tradeTeam }
      return a
    })

    const sendLabel = [...incoming.map((p) => p.name), ...incomingPicks.map((pk) => pickLabel(pk, s.leagueTeams))].join(', ')
    const receiveLabel = [...outgoing.map((p) => p.name), ...outgoingPicks.map((pk) => pickLabel(pk, s.leagueTeams))].join(', ')
    const tx = makeTransaction(
      'TRADE',
      `${teamLabel(s.myTeam, s.leagueTeams)} acquire ${sendLabel} from ${teamLabel(s.tradeTeam, s.leagueTeams)}`,
      `${teamLabel(s.tradeTeam, s.leagueTeams)} receives: ${receiveLabel}`,
      s.simDate
    )
    set({
      myRoster: newMyRoster,
      rosters: { ...s.rosters, [s.tradeTeam]: newTheirRoster },
      draftPickAssets: newPickAssets,
      lineup,
      tradeMyPicks: [],
      tradeTheirPicks: [],
      tradeMyPickAssets: [],
      tradeTheirPickAssets: [],
      transactions: [tx, ...s.transactions].slice(0, 50)
    })
    return true
  },

  setGamePlanField: (key, value) => set((s) => ({ gamePlan: { ...s.gamePlan, [key]: value } })),
  setDevFocus: (idx, focus) =>
    set((s) => {
      const df = [...s.devFocus]
      df[idx] = focus
      return { devFocus: df }
    }),
  setScoutTeam: (abbr) => set({ scoutTeam: abbr }),
  toggleRule: (key) => set((s) => ({ ruleFlags: { ...s.ruleFlags, [key]: !s.ruleFlags[key] } })),
  setExpField: (field, value) =>
    set({ [field]: field === 'expAbbr' ? value.toUpperCase().slice(0, 3) : value } as Partial<GameState>),

  addExpansionTeam: () => {
    const s = get()
    const abbr = s.expAbbr.trim().toUpperCase()
    if (!s.expCity.trim() || !s.expName.trim() || !abbr) return false
    if (s.leagueTeams.some((t) => t.abbr === abbr)) return false
    const hasTwoConfs = new Set(s.leagueTeams.map((t) => t.confIndex)).size === 2
    const newTeam: LeagueTeam = {
      abbr,
      city: s.expCity.trim(),
      name: s.expName.trim(),
      primary: s.expColor,
      secondary: '#FFFFFF',
      confIndex: hasTwoConfs ? (s.expConf === 'East' ? 0 : 1) : 0
    }
    const usedNames = new Set<string>([...Object.values(s.rosters).flat().map((p) => p.name), ...s.myRoster.map((p) => p.name)])
    const { roster, nextId } = generateOneRoster(Math.random() * 0.4, s.nextPlayerId, usedNames) // expansion teams start weaker
    const tx = makeTransaction('EXPANSION', `${newTeam.city} ${newTeam.name} join the league`, 'New expansion franchise added', s.simDate)
    const existingYears = Array.from(new Set(s.draftPickAssets.map((a) => a.year)))
    const newPickAssets = existingYears.flatMap((year) =>
      [1, 2].map((round) => ({ id: `${year}-${round}-${abbr}`, year, round, originalTeam: abbr, currentOwner: abbr }))
    )
    set({
      leagueTeams: [...s.leagueTeams, newTeam],
      rosters: { ...s.rosters, [abbr]: roster },
      nextPlayerId: nextId,
      records: { ...s.records, [abbr]: { w: 0, l: 0, l10: '0-0' } },
      draftPickAssets: [...s.draftPickAssets, ...newPickAssets],
      expCity: '',
      expName: '',
      expAbbr: '',
      expColor: '#1D428A',
      transactions: [tx, ...s.transactions].slice(0, 50)
    })
    return true
  },

  swapStarter: (slotIndex, benchPlayerId) =>
    set((s) => {
      const prevStarter = s.lineup.starters[slotIndex]
      const starters = [...s.lineup.starters]
      starters[slotIndex] = benchPlayerId
      const bench = s.lineup.bench.filter((id) => id !== benchPlayerId)
      if (prevStarter !== undefined) bench.unshift(prevStarter)
      return { lineup: { starters, bench } }
    }),
  moveBenchPlayer: (playerId, direction) =>
    set((s) => {
      const bench = [...s.lineup.bench]
      const idx = bench.indexOf(playerId)
      if (idx < 0) return {}
      const swapWith = direction === 'up' ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= bench.length) return {}
      ;[bench[idx], bench[swapWith]] = [bench[swapWith], bench[idx]]
      return { lineup: { ...s.lineup, bench } }
    }),

  makeFreeAgentOffer: (playerId, years, annualSalary) => {
    const s = get()
    const fa = s.freeAgentPool.find((p) => p.id === playerId)
    if (!fa) return false
    const capLimit = (s.config?.salaryCap ?? 136) * 1e6
    const totalSalary = s.myRoster.reduce((a, p) => a + p.salary, 0)
    if (s.config?.hardCap && totalSalary + annualSalary > capLimit) return false

    const freeAgentNegotiations = submitFreeAgentOfferEngine(s.freeAgentNegotiations, fa, years, annualSalary, s.myTeam, s.offseasonDay)
    set({ freeAgentNegotiations })
    return true
  },

  acceptCounterOffer: (playerId) => {
    const s = get()
    const neg = s.freeAgentNegotiations[playerId]
    const fa = s.freeAgentPool.find((p) => p.id === playerId)
    const bestRival = neg?.rivalOffers.slice().sort((a, b) => b.annualSalary - a.annualSalary)[0]
    if (!neg || !fa || !bestRival) return
    const capLimit = (s.config?.salaryCap ?? 136) * 1e6
    const totalSalary = s.myRoster.reduce((a, p) => a + p.salary, 0)
    if (s.config?.hardCap && totalSalary + bestRival.annualSalary > capLimit) return

    const freeAgentNegotiations = submitFreeAgentOfferEngine(
      s.freeAgentNegotiations,
      fa,
      bestRival.years,
      Math.round(bestRival.annualSalary * 1.02),
      s.myTeam,
      s.offseasonDay
    )
    set({ freeAgentNegotiations })
  },

  withdrawFreeAgentOffer: (playerId) =>
    set((s) => {
      const neg = s.freeAgentNegotiations[playerId]
      if (!neg) return {}
      // Keep the negotiation around if CPU rivals are still bidding (so their
      // offers stay visible), just clear the human's own offer.
      if (neg.rivalOffers.length > 0) {
        return {
          freeAgentNegotiations: {
            ...s.freeAgentNegotiations,
            [playerId]: { ...neg, myOffer: null, agentResponse: 'pending', agentMessage: '' }
          }
        }
      }
      const next = { ...s.freeAgentNegotiations }
      delete next[playerId]
      return { freeAgentNegotiations: next }
    }),

  claimWaiver: (playerId) => {
    const s = get()
    const wp = s.waiverPool.find((p) => p.id === playerId)
    if (!wp) return false
    const newRoster = [...s.myRoster, wp]
    const tx = makeTransaction('SIGN', `Claim ${wp.name} off waivers`, `${wp.pos} · OVR ${wp.ovr}`, s.simDate)
    set({
      myRoster: newRoster,
      waiverPool: s.waiverPool.filter((p) => p.id !== playerId),
      lineup: reconcileLineup(s.lineup, newRoster, [wp.id]),
      transactions: [tx, ...s.transactions].slice(0, 50)
    })
    return true
  },

  simDay1: () => runSim(1, get, set),
  simWeek1: () => runSim(7, get, set),
  simMonth1: () => runSim(30, get, set),

  simPlayoffs1Day: () =>
    set((s) => {
      if (s.seasonPhase !== 'playoffs' || !s.playoffs || !s.config) return {}
      const result = simPlayoffDayEngine(s.playoffs, s.leagueTeams, s.myTeam, s.myRoster, s.lineup, s.gamePlan, s.rosters, s.config.roundGames)
      const patch: Partial<GameState> = { playoffs: result.bracket }
      if (result.myBoxScore) patch.lastBoxScore = result.myBoxScore
      if (result.myResult) {
        const r = result.myResult
        patch.simResults = [{ opp: r.opp, myPts: r.myPts, oppPts: r.oppPts, won: r.won, d: s.simDate.d, m: s.simDate.m }, ...s.simResults].slice(0, 10)
      }
      if (result.bracket.champion) {
        patch.seasonPhase = 'offseason'
        patch.offseasonCalendar = generateOffseasonCalendar(s.simDate)
        patch.offseasonDay = 0
        patch.offseasonPhase = 'combine'
        // Prospects need to exist from day 0 of the offseason so scouting has
        // something to work with well before the human ever opens Draft Room.
        patch.draftProspects = generateProspects()
        patch.scoutingAllocations = {}
      }
      return patch
    }),

  simOffseasonDay1: () => runOffseasonSim(1, get, set),
  simOffseasonWeek1: () => runOffseasonSim(7, get, set),
  simOffseasonMonth1: () => runOffseasonSim(30, get, set),

  startNextSeason: () =>
    set((s) => {
      if (!s.config) return {}
      const result = advanceToNextSeasonEngine(
        s.config,
        s.leagueTeams,
        s.myRoster,
        s.rosters,
        s.freeAgentPool,
        s.waiverPool,
        s.draftPicks,
        s.myTeam,
        s.seasonNumber,
        s.simDate,
        s.nextPlayerId,
        s.draftPickAssets,
        s.draftYear
      )
      const nextDraftYear = result.draftPickAssets.length ? Math.min(...result.draftPickAssets.map((a) => a.year)) : s.draftYear + 1
      return {
        myRoster: result.myRoster,
        rosters: result.rosters,
        freeAgentPool: result.freeAgentPool,
        waiverPool: result.waiverPool,
        nextPlayerId: result.nextPlayerId,
        records: result.records,
        calendar: result.calendar,
        seasonNumber: result.seasonNumber,
        lineup: result.lineup,
        simDay: 0,
        simDate: result.calendar.games[0]?.date ?? s.simDate,
        simResults: [],
        lastBoxScore: null,
        allStarResult: null,
        allStarMvp: null,
        playoffs: null,
        seasonPhase: 'regular' as SeasonPhase,
        offseasonCalendar: null,
        offseasonDay: 0,
        offseasonPhase: null,
        draftPhase: 'off' as DraftPhase,
        draftProspects: null,
        draftCurrentPick: 0,
        draftPicks: [],
        draftFullOrder: [],
        draftSlotOwners: [],
        draftPickAssets: result.draftPickAssets,
        draftYear: nextDraftYear,
        lotteryRevealOrder: null,
        lotteryRevealedCount: 0,
        scoutingAllocations: {},
        freeAgentNegotiations: {},
        pendingOffers: [],
        progressionLog: [],
        tradeMyPickAssets: [],
        tradeTheirPickAssets: [],
        transactions: [...result.offseasonLog, ...s.transactions].slice(0, 50)
      }
    }),

  initDraft: () => set((s) => ({ draftPhase: 'lottery', draftProspects: s.draftProspects ?? generateProspects() })),

  runLottery: () =>
    set((s) => {
      const fullOrder = runLotteryOrder(s.leagueTeams, s.records)
      const slotOwners = resolvePickOwners(fullOrder, s.draftPickAssets, s.draftYear)
      const revealOrder = fullOrder.slice(0, Math.min(14, fullOrder.length)).slice().reverse()
      return {
        draftPhase: 'lotteryReveal',
        draftFullOrder: fullOrder,
        draftSlotOwners: slotOwners,
        lotteryRevealOrder: revealOrder,
        lotteryRevealedCount: 0
      }
    }),

  revealNextLotteryPick: () =>
    set((s) => {
      if (!s.lotteryRevealOrder) return {}
      const nextCount = Math.min(s.lotteryRevealedCount + 1, s.lotteryRevealOrder.length)
      if (nextCount < s.lotteryRevealOrder.length) return { lotteryRevealedCount: nextCount }
      const prospects = s.draftProspects ?? generateProspects()
      const { picks, prospects: nextProspects, currentPick } = runInitialPicks(s.draftFullOrder, s.draftSlotOwners, prospects, s.myTeam, s.rosters)
      return {
        lotteryRevealedCount: nextCount,
        draftPhase: 'board',
        draftProspects: nextProspects,
        draftPicks: picks,
        draftCurrentPick: currentPick
      }
    }),

  skipLotteryReveal: () =>
    set((s) => {
      if (!s.lotteryRevealOrder) return {}
      const prospects = s.draftProspects ?? generateProspects()
      const { picks, prospects: nextProspects, currentPick } = runInitialPicks(s.draftFullOrder, s.draftSlotOwners, prospects, s.myTeam, s.rosters)
      return {
        lotteryRevealedCount: s.lotteryRevealOrder.length,
        draftPhase: 'board',
        draftProspects: nextProspects,
        draftPicks: picks,
        draftCurrentPick: currentPick
      }
    }),

  setScoutingAllocation: (prospectId, points) =>
    set((s) => ({ scoutingAllocations: { ...s.scoutingAllocations, [prospectId]: Math.max(0, points) } })),

  draftPlayer: (id) =>
    set((s) => {
      if (!s.draftProspects) return {}
      const roundSize = s.draftFullOrder.length / 2
      const ps = [...s.draftProspects]
      const picks = [...s.draftPicks]
      const pi = ps.findIndex((p) => p.id === id)
      if (pi < 0) return {}
      const originalNow = s.draftFullOrder[s.draftCurrentPick]
      ps[pi] = { ...ps[pi], drafted: true, draftTeam: s.myTeam, draftPick: s.draftCurrentPick + 1 }
      picks.push({
        pickNum: s.draftCurrentPick + 1,
        round: Math.floor(s.draftCurrentPick / roundSize) + 1,
        team: s.myTeam,
        originalTeam: originalNow,
        prospect: { ...ps[pi] }
      })
      let next = s.draftCurrentPick + 1
      while (next < s.draftSlotOwners.length && s.draftSlotOwners[next] !== s.myTeam) {
        const cpu = s.draftSlotOwners[next]
        const originalCpu = s.draftFullOrder[next]
        const best = pickBestProspectForTeam(ps, s.rosters[cpu] ?? [])
        if (!best) break
        const idx = ps.indexOf(best)
        ps[idx] = { ...ps[idx], drafted: true, draftTeam: cpu, draftPick: next + 1 }
        picks.push({ pickNum: next + 1, round: Math.floor(next / roundSize) + 1, team: cpu, originalTeam: originalCpu, prospect: { ...ps[idx] } })
        next++
      }
      return {
        draftProspects: ps,
        draftPicks: picks,
        draftCurrentPick: next,
        draftPhase: next >= s.draftSlotOwners.length ? 'complete' : 'board'
      }
    }),

  // A real, two-sided swap: the human's outgoing player actually joins the
  // CPU team's persisted roster, matched by id (not name) now that CPU
  // rosters are real and id-addressable.
  acceptOffer: (id) =>
    set((s) => {
      const offer = s.pendingOffers.find((o) => o.id === id)
      if (!offer) return {}
      const outgoing = s.myRoster.find((p) => p.id === offer.wantPlayerId)
      const theirRoster = s.rosters[offer.fromTeam] ?? []
      const incoming = theirRoster.find((p) => p.id === offer.fromPlayerId)
      if (!outgoing || !incoming) return { pendingOffers: s.pendingOffers.filter((o) => o.id !== id) }

      const newMyRoster = [...s.myRoster.filter((p) => p.id !== outgoing.id), incoming]
      const newTheirRoster = [...theirRoster.filter((p) => p.id !== incoming.id), outgoing]
      const newPickAssets = s.draftPickAssets.map((a) => {
        if (offer.offerPickId && a.id === offer.offerPickId) return { ...a, currentOwner: s.myTeam }
        if (offer.wantPickId && a.id === offer.wantPickId) return { ...a, currentOwner: offer.fromTeam }
        return a
      })
      const sendLabel = offer.offerName + (offer.offerPickLabel ? ` + ${offer.offerPickLabel}` : '')
      const receiveLabel = offer.wantName + (offer.wantPickLabel ? ` + ${offer.wantPickLabel}` : '')
      const tx = makeTransaction(
        'TRADE',
        `${teamLabel(s.myTeam, s.leagueTeams)} acquire ${sendLabel} from ${offer.fromName}`,
        `${offer.fromName} receives: ${receiveLabel}`,
        s.simDate
      )
      return {
        myRoster: newMyRoster,
        rosters: { ...s.rosters, [offer.fromTeam]: newTheirRoster },
        draftPickAssets: newPickAssets,
        lineup: reconcileLineup(s.lineup, newMyRoster, [incoming.id]),
        pendingOffers: s.pendingOffers.filter((o) => o.id !== id),
        transactions: [tx, ...s.transactions].slice(0, 50)
      }
    }),
  declineOffer: (id) => set((s) => ({ pendingOffers: s.pendingOffers.filter((o) => o.id !== id) })),

  loadSnapshot: (snap) => {
    const rosters: Record<string, RosterPlayer[]> = {}
    Object.entries(snap.rosters ?? {}).forEach(([abbr, roster]) => (rosters[abbr] = backfillPotential(roster)))
    const draftPickAssets =
      snap.draftPickAssets && snap.draftPickAssets.length > 0
        ? snap.draftPickAssets
        : seedDraftPickWindow(snap.leagueTeams, snap.simDate.y + 1, PICK_WINDOW_YEARS)
    const draftYear = snap.draftYear ?? snap.simDate.y + 1
    set({
      page: snap.page,
      conf: snap.conf === 'east' ? 0 : 1,
      simDate: snap.simDate,
      simDay: snap.simDay,
      records: snap.records,
      simResults: snap.simResults,
      lastBoxScore: snap.lastBoxScore,
      rosterSort: snap.rosterSort,
      statCat: snap.statCat,
      tradeTeam: snap.tradeTeam,
      tradeMyPicks: snap.tradeMyPicks,
      tradeTheirPicks: snap.tradeTheirPicks,
      tradeMyPickAssets: snap.tradeMyPickAssets ?? [],
      tradeTheirPickAssets: snap.tradeTheirPickAssets ?? [],
      gamePlan: snap.gamePlan,
      devFocus: snap.devFocus,
      scoutTeam: snap.scoutTeam,
      ruleFlags: snap.ruleFlags,
      expCity: snap.expCity,
      expName: snap.expName,
      expAbbr: snap.expAbbr,
      expConf: snap.expConf,
      expColor: snap.expColor,
      draftPhase: snap.draftPhase,
      draftProspects: snap.draftProspects,
      draftCurrentPick: snap.draftCurrentPick,
      draftPicks: snap.draftPicks,
      draftFullOrder: snap.draftFullOrder,
      draftSlotOwners: snap.draftSlotOwners ?? [],
      draftPickAssets,
      draftYear,
      lotteryRevealOrder: snap.lotteryRevealOrder,
      lotteryRevealedCount: snap.lotteryRevealedCount,
      scoutingAllocations: snap.scoutingAllocations ?? {},
      freeAgentNegotiations: snap.freeAgentNegotiations ?? {},
      pendingOffers: snap.pendingOffers,
      progressionLog: snap.progressionLog,
      myRoster: backfillPotential(snap.myRoster),
      myTeam: snap.myTeam,
      leagueTeams: snap.leagueTeams,
      calendar: snap.calendar,
      seasonNumber: snap.seasonNumber,
      seasonPhase: snap.seasonPhase,
      offseasonCalendar: snap.offseasonCalendar,
      offseasonDay: snap.offseasonDay,
      offseasonPhase: snap.offseasonPhase,
      playoffs: snap.playoffs,
      lineup: snap.lineup,
      allStarResult: snap.allStarResult,
      allStarMvp: snap.allStarMvp,
      transactions: snap.transactions,
      rosters,
      freeAgentPool: backfillPotential(snap.freeAgentPool),
      waiverPool: backfillPotential(snap.waiverPool),
      nextPlayerId: snap.nextPlayerId,
      initialized: true
    })
  }
}))

export function buildGameSnapshot(s: GameState): GameSnapshot {
  return {
    page: s.page,
    conf: s.conf === 0 ? 'east' : 'west',
    simDate: s.simDate,
    simDay: s.simDay,
    records: s.records,
    simResults: s.simResults,
    lastBoxScore: s.lastBoxScore,
    rosterSort: s.rosterSort,
    statCat: s.statCat,
    tradeTeam: s.tradeTeam,
    tradeMyPicks: s.tradeMyPicks,
    tradeTheirPicks: s.tradeTheirPicks,
    tradeMyPickAssets: s.tradeMyPickAssets,
    tradeTheirPickAssets: s.tradeTheirPickAssets,
    gamePlan: s.gamePlan,
    devFocus: s.devFocus,
    scoutTeam: s.scoutTeam,
    ruleFlags: s.ruleFlags,
    expCity: s.expCity,
    expName: s.expName,
    expAbbr: s.expAbbr,
    expConf: s.expConf,
    expColor: s.expColor,
    draftPhase: s.draftPhase,
    draftProspects: s.draftProspects,
    draftCurrentPick: s.draftCurrentPick,
    draftPicks: s.draftPicks,
    draftFullOrder: s.draftFullOrder,
    draftSlotOwners: s.draftSlotOwners,
    draftPickAssets: s.draftPickAssets,
    draftYear: s.draftYear,
    lotteryRevealOrder: s.lotteryRevealOrder,
    lotteryRevealedCount: s.lotteryRevealedCount,
    scoutingAllocations: s.scoutingAllocations,
    freeAgentNegotiations: s.freeAgentNegotiations,
    pendingOffers: s.pendingOffers,
    progressionLog: s.progressionLog,
    myRoster: s.myRoster,
    myTeam: s.myTeam,
    leagueTeams: s.leagueTeams,
    calendar: s.calendar,
    seasonNumber: s.seasonNumber,
    seasonPhase: s.seasonPhase,
    offseasonCalendar: s.offseasonCalendar,
    offseasonDay: s.offseasonDay,
    offseasonPhase: s.offseasonPhase,
    playoffs: s.playoffs,
    lineup: s.lineup,
    allStarResult: s.allStarResult,
    allStarMvp: s.allStarMvp,
    transactions: s.transactions,
    rosters: s.rosters,
    freeAgentPool: s.freeAgentPool,
    waiverPool: s.waiverPool,
    nextPlayerId: s.nextPlayerId
  }
}

export { TEAM_DATA, playerValue }
