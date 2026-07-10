import { describe, expect, it } from 'vitest'
import {
  finalizeOffseasonToNextSeason,
  generateOffseasonCalendar,
  generateProspects,
  resolveFreeAgentDay,
  runCombine,
  simOffseasonDays,
  submitFreeAgentOffer,
  allocateScoutingEffort
} from '@renderer/data/engine'
import type {
  DraftProspect,
  FreeAgentNegotiation,
  LeagueConfig,
  LeagueTeamSeed,
  RosterPlayer,
  SimDate
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
