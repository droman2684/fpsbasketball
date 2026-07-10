import { describe, expect, it } from 'vitest'
import {
  applyTimeoutBoost,
  finalizeGameSim,
  finalizeOffseasonToNextSeason,
  generateOffseasonCalendar,
  generateProspects,
  initGameSim,
  resolveFreeAgentDay,
  runCombine,
  simDays,
  simOffseasonDays,
  simToNextQuarter,
  submitFreeAgentOffer,
  allocateScoutingEffort
} from '@renderer/data/engine'
import type {
  DraftProspect,
  FreeAgentNegotiation,
  GamePlanConfig,
  LeagueConfig,
  LeagueTeamSeed,
  LineupState,
  RosterPlayer,
  ScheduledGame,
  SeasonCalendar,
  SimDate,
  TeamRecord
} from '@shared/types'

function makeProspect(overrides: Partial<DraftProspect> = {}): DraftProspect {
  return {
    id: 'p1',
    rank: 1,
    name: 'Test Prospect',
    pos: 'PG',
    age: 19,
    ovr: 80,
    potential: 'A-',
    origin: 'Duke',
    pts: '15.0',
    reb: '4.0',
    ast: '5.0',
    drafted: false,
    draftTeam: null,
    draftPick: null,
    scoutedOvrRange: { lo: 65, hi: 95 },
    scoutedPotentialRange: ['C+', 'A+'],
    scoutingProgress: 0,
    varianceType: 'normal',
    combineRevealed: false,
    ...overrides
  }
}

function makePlayer(overrides: Partial<RosterPlayer> = {}): RosterPlayer {
  return {
    id: 1,
    name: 'Player One',
    pos: 'PG',
    age: 25,
    ovr: 75,
    pts: 15,
    reb: 4,
    ast: 5,
    salary: 5_000_000,
    yrs: 2,
    status: 'Active',
    potential: 80,
    ...overrides
  }
}

function makeConfig(overrides: Partial<LeagueConfig> = {}): LeagueConfig {
  return {
    leagueName: 'Test League',
    teamsCount: 2,
    gamesPerSeason: 10,
    divsPerConf: 0,
    conferences: [
      { name: 'East', divisions: [] },
      { name: 'West', divisions: [] }
    ],
    selectedTeams: ['LAL', 'BOS'],
    fictionalTeams: [],
    myTeam: 'LAL',
    playoffTeamsPerConf: 1,
    roundGames: [7],
    salaryCap: 136,
    hardCap: false,
    ...overrides
  }
}

const SEASON_END: SimDate = { y: 2027, m: 6, d: 15 }

describe('generateProspects', () => {
  it('seeds every prospect with a fog-of-war scouted range and zeroed progress', () => {
    const prospects = generateProspects()
    expect(prospects).toHaveLength(60)
    prospects.forEach((p) => {
      expect(p.scoutingProgress).toBe(0)
      expect(p.combineRevealed).toBe(false)
      expect(p.scoutedOvrRange.lo).toBeLessThanOrEqual(p.scoutedOvrRange.hi)
      if (p.varianceType === 'normal') {
        expect(p.scoutedOvrRange.lo).toBeLessThanOrEqual(p.ovr)
        expect(p.scoutedOvrRange.hi).toBeGreaterThanOrEqual(p.ovr)
      }
    })
  })
})

describe('runCombine', () => {
  it('narrows the scouted range and never changes the true ovr', () => {
    const p = makeProspect({ scoutedOvrRange: { lo: 60, hi: 100 } })
    const [after] = runCombine([p])
    expect(after.combineRevealed).toBe(true)
    expect(after.measurables).toBeDefined()
    expect(after.ovr).toBe(p.ovr)
    expect(after.scoutedOvrRange.hi - after.scoutedOvrRange.lo).toBeLessThan(p.scoutedOvrRange.hi - p.scoutedOvrRange.lo)
  })
})

describe('allocateScoutingEffort', () => {
  it('converges a normal prospect toward its true ovr with repeated scouting', () => {
    let p = makeProspect({ scoutedOvrRange: { lo: 60, hi: 100 }, varianceType: 'normal', ovr: 80 })
    for (let i = 0; i < 200; i++) {
      ;[p] = allocateScoutingEffort([p], { [p.id]: 10 })
    }
    expect(p.scoutingProgress).toBe(100)
    expect(Math.abs(p.scoutedOvrRange.lo - p.ovr)).toBeLessThanOrEqual(3)
    expect(Math.abs(p.scoutedOvrRange.hi - p.ovr)).toBeLessThanOrEqual(3)
  })

  it('never converges a bust prospect onto its true ovr, no matter how much scouting is spent', () => {
    let p = makeProspect({ scoutedOvrRange: { lo: 60, hi: 76 }, varianceType: 'bust', ovr: 80 })
    for (let i = 0; i < 50; i++) {
      ;[p] = allocateScoutingEffort([p], { [p.id]: 10 })
    }
    // The scouted range should have shrunk (more "confident") but must stay
    // below the true ovr — scouting more never self-corrects a bad read.
    expect(p.scoutedOvrRange.hi).toBeLessThan(p.ovr)
  })
})

describe('generateOffseasonCalendar', () => {
  it('produces strictly increasing milestones that land on next Oct 21', () => {
    const cal = generateOffseasonCalendar(SEASON_END)
    expect(cal.combineDay).toBeLessThan(cal.draftDay)
    expect(cal.draftDay).toBeLessThan(cal.faOpenDay)
    expect(cal.faOpenDay).toBeLessThan(cal.trainingCampDay)
    expect(cal.trainingCampDay).toBeLessThan(cal.seasonStartDay)

    const seasonStart = new Date(SEASON_END.y, SEASON_END.m - 1, SEASON_END.d)
    seasonStart.setDate(seasonStart.getDate() + cal.seasonStartDay)
    expect(seasonStart.getMonth()).toBe(9) // October, 0-indexed
    expect(seasonStart.getDate()).toBe(21)
    // The season ends in June — well before October — so the next tip-off
    // lands in October of that SAME year, not a year later.
    expect(seasonStart.getFullYear()).toBe(SEASON_END.y)
  })

  it('rolls to the following year when the season ends after Oct 21', () => {
    const lateEnd: SimDate = { y: 2027, m: 11, d: 5 }
    const cal2 = generateOffseasonCalendar(lateEnd)
    const seasonStart = new Date(lateEnd.y, lateEnd.m - 1, lateEnd.d)
    seasonStart.setDate(seasonStart.getDate() + cal2.seasonStartDay)
    expect(seasonStart.getFullYear()).toBe(lateEnd.y + 1)
  })
})

describe('simOffseasonDays', () => {
  const cal = generateOffseasonCalendar(SEASON_END)

  it('holds at the draft milestone until the draft is complete', () => {
    const result = simOffseasonDays({
      n: 400,
      offseasonDay: 0,
      simDate: SEASON_END,
      offseasonCalendar: cal,
      draftPhase: 'board',
      draftProspects: null,
      scoutingAllocations: {},
      freeAgentPool: [],
      rosters: {},
      myRoster: [],
      myTeam: 'LAL',
      config: makeConfig(),
      freeAgentNegotiations: {}
    })
    expect(result.stoppedAt).toBe('draft')
    expect(result.offseasonDay).toBe(cal.draftDay)
    expect(result.readyForNextSeason).toBe(false)
  })

  it('walks all the way to season start once the draft is complete', () => {
    const result = simOffseasonDays({
      n: cal.seasonStartDay + 10,
      offseasonDay: 0,
      simDate: SEASON_END,
      offseasonCalendar: cal,
      draftPhase: 'complete',
      draftProspects: null,
      scoutingAllocations: {},
      freeAgentPool: [],
      rosters: { LAL: [], BOS: [] },
      myRoster: [],
      myTeam: 'LAL',
      config: makeConfig(),
      freeAgentNegotiations: {}
    })
    expect(result.readyForNextSeason).toBe(true)
    expect(result.offseasonDay).toBe(cal.seasonStartDay)
  })
})

describe('free agent negotiation', () => {
  it('accepts a generous human offer over a weak rival and signs the player', () => {
    const player = makePlayer({ id: 42, salary: 8_000_000 })
    let negotiations: Record<number, FreeAgentNegotiation> = {}
    negotiations = submitFreeAgentOffer(negotiations, player, 3, 12_000_000, 'LAL', 65)
    negotiations[42] = {
      ...negotiations[42],
      rivalOffers: [{ id: 'r1', playerId: 42, team: 'BOS', years: 2, annualSalary: 6_000_000, submittedDay: 65 }],
      marketValue: 8_000_000
    }
    const result = resolveFreeAgentDay(negotiations, [player], { BOS: [] }, [], 'LAL')
    expect(result.signings).toHaveLength(1)
    expect(result.signings[0].team).toBe('LAL')
    expect(result.myRoster.some((p) => p.id === 42)).toBe(true)
    expect(result.freeAgentPool.some((p) => p.id === 42)).toBe(false)
  })

  it('auto-signs the best offer once patience runs out with no human offer on the table', () => {
    const player = makePlayer({ id: 43, salary: 5_000_000 })
    const negotiations: Record<number, FreeAgentNegotiation> = {
      43: {
        playerId: 43,
        myOffer: null,
        rivalOffers: [{ id: 'r2', playerId: 43, team: 'BOS', years: 2, annualSalary: 6_000_000, submittedDay: 60 }],
        agentResponse: 'pending',
        agentMessage: '',
        patience: 1,
        marketValue: 6_000_000,
        reSignBias: 0
      }
    }
    const result = resolveFreeAgentDay(negotiations, [player], { BOS: [] }, [], 'LAL')
    expect(result.signings).toHaveLength(1)
    expect(result.signings[0].team).toBe('BOS')
    expect(result.rosters.BOS.some((p) => p.id === 43)).toBe(true)
  })
})

describe('finalizeOffseasonToNextSeason', () => {
  it('keeps roster sizes at or under 15, increments the season number, and never duplicates a player id', () => {
    const teams: LeagueTeamSeed[] = [
      { abbr: 'LAL', city: 'Los Angeles', name: 'Lakers', primary: '#552583', secondary: '#FDB927', confIndex: 0 },
      { abbr: 'BOS', city: 'Boston', name: 'Celtics', primary: '#007A33', secondary: '#BA9653', confIndex: 1 }
    ]
    const myRoster = Array.from({ length: 14 }, (_, i) => makePlayer({ id: i + 1 }))
    const bosRoster = Array.from({ length: 16 }, (_, i) => makePlayer({ id: 100 + i }))

    const result = finalizeOffseasonToNextSeason(
      makeConfig(),
      teams,
      myRoster,
      { BOS: bosRoster },
      [],
      [],
      [],
      'LAL',
      1,
      SEASON_END,
      1000,
      [],
      2027
    )

    expect(result.myRoster.length).toBeLessThanOrEqual(15)
    Object.values(result.rosters).forEach((roster) => expect(roster.length).toBeLessThanOrEqual(15))
    expect(result.seasonNumber).toBe(2)

    const allIds = [...result.myRoster, ...Object.values(result.rosters).flat()].map((p) => p.id)
    expect(new Set(allIds).size).toBe(allIds.length)
  })
})

const EMPTY_LINEUP: LineupState = { starters: [], bench: [] }
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C']

function makeGameRoster(idOffset: number, count = 10): RosterPlayer[] {
  return Array.from({ length: count }, (_, i) =>
    makePlayer({ id: idOffset + i, name: `Player ${idOffset + i}`, pos: POSITIONS[i % 5], ovr: 70 + (i % 10), age: 24 })
  )
}

function makeNeutralGamePlan(): GamePlanConfig {
  return { pace: 50, threePoint: 50, post: 50, defense: 50, fastBreak: 50, ballMovement: 50 }
}

describe('initGameSim / simToNextQuarter / finalizeGameSim', () => {
  it('walks a full game in quarter-sized segments to a well-formed final result', () => {
    const home = makeGameRoster(1)
    const away = makeGameRoster(100)
    const gamePlan = makeNeutralGamePlan()
    const state = initGameSim(home, EMPTY_LINEUP, gamePlan, away, EMPTY_LINEUP, gamePlan, false)

    let result = simToNextQuarter(state)
    let segments = 1
    while (!result.gameOver) {
      result = simToNextQuarter(state)
      segments++
    }
    expect(segments).toBeGreaterThanOrEqual(4)

    const final = finalizeGameSim(state)
    expect(final.home.pts).toBe(result.homePts)
    expect(final.away.pts).toBe(result.awayPts)
    expect(final.home.pts).not.toBe(final.away.pts)
    expect(final.home.q[0] + final.home.q[1] + final.home.q[2] + final.home.q[3]).toBe(final.home.pts)
    expect(final.away.q[0] + final.away.q[1] + final.away.q[2] + final.away.q[3]).toBe(final.away.pts)
    expect(final.home.players.length).toBeGreaterThan(0)
    expect(final.away.players.length).toBeGreaterThan(0)
  })
})

describe('applyTimeoutBoost', () => {
  it('measurably raises scoring for the very next segment, then clears itself', () => {
    const gamePlan = makeNeutralGamePlan()
    const TRIALS = 100
    let withBoost = 0
    let withoutBoost = 0
    for (let i = 0; i < TRIALS; i++) {
      const boostedState = initGameSim(makeGameRoster(1), EMPTY_LINEUP, gamePlan, makeGameRoster(100), EMPTY_LINEUP, gamePlan, false)
      applyTimeoutBoost(boostedState, 'home', 0.3)
      withBoost += simToNextQuarter(boostedState).quarterHomePts

      const plainState = initGameSim(makeGameRoster(1), EMPTY_LINEUP, gamePlan, makeGameRoster(100), EMPTY_LINEUP, gamePlan, false)
      withoutBoost += simToNextQuarter(plainState).quarterHomePts
    }
    expect(withBoost / TRIALS).toBeGreaterThan(withoutBoost / TRIALS)
  })

  it('is consumed by the next simToNextQuarter call and does not persist beyond it', () => {
    const gamePlan = makeNeutralGamePlan()
    const state = initGameSim(makeGameRoster(1), EMPTY_LINEUP, gamePlan, makeGameRoster(100), EMPTY_LINEUP, gamePlan, false)
    applyTimeoutBoost(state, 'home')
    expect(state.home.timeoutBoost).toBeGreaterThan(0)
    simToNextQuarter(state)
    expect(state.home.timeoutBoost).toBe(0)
  })
})

describe('simDays pauses for the human\'s own game', () => {
  function makeTwoTeamCalendar(): SeasonCalendar {
    const games: ScheduledGame[] = [
      { day: 1, date: { y: 2027, m: 1, d: 2 }, home: 'LAL', away: 'BOS' },
      { day: 3, date: { y: 2027, m: 1, d: 4 }, home: 'BOS', away: 'LAL' }
    ]
    return { games, allStarDay: 0, seasonEndDay: 10 }
  }

  function baseArgs() {
    const teams: LeagueTeamSeed[] = [
      { abbr: 'LAL', city: 'Los Angeles', name: 'Lakers', primary: '#552583', secondary: '#FDB927', confIndex: 0 },
      { abbr: 'BOS', city: 'Boston', name: 'Celtics', primary: '#007A33', secondary: '#BA9653', confIndex: 1 }
    ]
    const records: Record<string, TeamRecord> = { LAL: { w: 0, l: 0, l10: '0-0' }, BOS: { w: 0, l: 0, l10: '0-0' } }
    return {
      teams,
      records,
      rosters: { BOS: makeGameRoster(100) },
      simDate: { y: 2027, m: 1, d: 1 } as SimDate,
      simDay: 0,
      calendar: makeTwoTeamCalendar(),
      myTeam: 'LAL',
      myRoster: makeGameRoster(1),
      lineup: EMPTY_LINEUP,
      gamePlan: makeNeutralGamePlan(),
      pendingOffers: [],
      pickAssets: [],
      currentYear: 2027
    }
  }

  it('halts before processing the day of the human\'s game, rolling simDay back to the day before it', () => {
    const result = simDays({ ...baseArgs(), n: 5, autoResolveUserGames: false })
    expect(result.pendingUserGame).not.toBeNull()
    expect(result.pendingUserGame?.day).toBe(1)
    expect(result.simDay).toBe(0)
  })

  it('resolves that one day when re-invoked with autoResolveUserGames, then the batch can continue and pause again at the next human game', () => {
    const args = baseArgs()
    const firstPause = simDays({ ...args, n: 5, autoResolveUserGames: false })
    expect(firstPause.pendingUserGame).not.toBeNull()

    const resolved = simDays({
      ...args,
      records: firstPause.records,
      rosters: firstPause.rosters,
      myRoster: firstPause.myRoster,
      simDate: firstPause.simDate,
      simDay: firstPause.simDay,
      n: 1,
      autoResolveUserGames: true
    })
    expect(resolved.pendingUserGame).toBeNull()
    expect(resolved.simDay).toBe(1)
    expect(resolved.lastBoxScore).not.toBeNull()

    const secondPause = simDays({
      ...args,
      records: resolved.records,
      rosters: resolved.rosters,
      myRoster: resolved.myRoster,
      simDate: resolved.simDate,
      simDay: resolved.simDay,
      n: 4,
      autoResolveUserGames: false
    })
    expect(secondPause.pendingUserGame).not.toBeNull()
    expect(secondPause.pendingUserGame?.day).toBe(3)
  })
})
