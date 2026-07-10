import { create } from 'zustand'
import { NBA_TEAMS } from '@renderer/data/teams'
import { getTextColor } from '@renderer/styles/theme'
import type { ConferenceConfig, FictionalTeam, LeagueConfig } from '@shared/types'

export type WizardPage = 'landing' | 'wizard' | 'load'

interface NewTeamDraft {
  name: string
  city: string
  abbr: string
  primary: string
  secondary: string
}

function emptyNewTeam(): NewTeamDraft {
  return { name: '', city: '', abbr: '', primary: '#1D428A', secondary: '#FFC72C' }
}

interface WizardState {
  page: WizardPage
  wizardStep: number
  leagueName: string
  teamsCount: number
  gamesPerSeason: number
  divsPerConf: 0 | 2 | 3
  conferences: ConferenceConfig[]
  selectedTeams: string[]
  fictionalTeams: FictionalTeam[]
  teamSearch: string
  showAddFictional: boolean
  newTeam: NewTeamDraft
  myTeam: string | null
  playoffTeamsPerConf: number
  roundGames: number[]
  salaryCap: number
  hardCap: boolean

  goCreate: () => void
  goLoad: () => void
  backToLanding: () => void
  goNext: () => void
  goBack: () => void

  setLeagueName: (v: string) => void
  setTeamsCount: (v: number) => void
  setGamesPerSeason: (v: number) => void

  setConfCount: (n: number) => void
  setDivsPerConf: (n: 0 | 2 | 3) => void
  setConfName: (idx: number, name: string) => void
  setDivName: (confIdx: number, divIdx: number, name: string) => void

  setTeamSearch: (v: string) => void
  toggleTeam: (abbr: string) => void
  selectAll: () => void
  deselectAll: () => void
  toggleAddFictional: () => void
  setNewTeamField: (field: keyof NewTeamDraft, value: string) => void
  addFictionalTeam: () => void

  pickMyTeam: (abbr: string) => void

  setPlayoffTeams: (n: number) => void
  setRoundGames: (idx: number, games: number) => void
  setSalaryCap: (n: number) => void
  setHardCap: (v: boolean) => void

  reset: () => void
  buildLeagueConfig: () => LeagueConfig
}

function initialState(): Omit<
  WizardState,
  | 'goCreate'
  | 'goLoad'
  | 'backToLanding'
  | 'goNext'
  | 'goBack'
  | 'setLeagueName'
  | 'setTeamsCount'
  | 'setGamesPerSeason'
  | 'setConfCount'
  | 'setDivsPerConf'
  | 'setConfName'
  | 'setDivName'
  | 'setTeamSearch'
  | 'toggleTeam'
  | 'selectAll'
  | 'deselectAll'
  | 'toggleAddFictional'
  | 'setNewTeamField'
  | 'addFictionalTeam'
  | 'pickMyTeam'
  | 'setPlayoffTeams'
  | 'setRoundGames'
  | 'setSalaryCap'
  | 'setHardCap'
  | 'reset'
  | 'buildLeagueConfig'
> {
  return {
    page: 'landing',
    wizardStep: 1,
    leagueName: 'My Basketball League',
    teamsCount: 30,
    gamesPerSeason: 82,
    divsPerConf: 3,
    conferences: [
      { name: 'Eastern Conference', divisions: ['Atlantic Division', 'Central Division', 'Southeast Division'] },
      { name: 'Western Conference', divisions: ['Northwest Division', 'Pacific Division', 'Southwest Division'] }
    ],
    selectedTeams: NBA_TEAMS.map((t) => t.abbr),
    fictionalTeams: [],
    teamSearch: '',
    showAddFictional: false,
    newTeam: emptyNewTeam(),
    myTeam: null,
    playoffTeamsPerConf: 8,
    roundGames: [7, 7, 7, 7],
    salaryCap: 136,
    hardCap: true
  }
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState(),

  goCreate: () => set({ page: 'wizard', wizardStep: 1 }),
  goLoad: () => set({ page: 'load' }),
  backToLanding: () => set({ page: 'landing' }),
  goNext: () => set((s) => ({ wizardStep: Math.min(6, s.wizardStep + 1) })),
  goBack: () => set((s) => ({ wizardStep: Math.max(1, s.wizardStep - 1) })),

  setLeagueName: (v) => set({ leagueName: v }),
  setTeamsCount: (v) => set({ teamsCount: v }),
  setGamesPerSeason: (v) => set({ gamesPerSeason: v }),

  setConfCount: (n) =>
    set((s) => {
      let confs = [...s.conferences]
      if (n > confs.length) {
        while (confs.length < n) {
          const idx = confs.length + 1
          confs.push({
            name: `Conference ${idx}`,
            divisions: Array(s.divsPerConf).fill(0).map((_, j) => `Division ${j + 1}`)
          })
        }
      } else {
        confs = confs.slice(0, n)
      }
      return { conferences: confs }
    }),

  setDivsPerConf: (n) =>
    set((s) => ({
      divsPerConf: n,
      conferences: s.conferences.map((c) => {
        const divs = [...c.divisions]
        if (n > divs.length) {
          while (divs.length < n) divs.push(`Division ${divs.length + 1}`)
        } else {
          divs.length = n
        }
        return { ...c, divisions: [...divs] }
      })
    })),

  setConfName: (idx, name) =>
    set((s) => ({
      conferences: s.conferences.map((c, i) => (i === idx ? { ...c, name } : c))
    })),

  setDivName: (confIdx, divIdx, name) =>
    set((s) => ({
      conferences: s.conferences.map((c, i) => {
        if (i !== confIdx) return c
        return { ...c, divisions: c.divisions.map((d, j) => (j === divIdx ? name : d)) }
      })
    })),

  setTeamSearch: (v) => set({ teamSearch: v }),
  toggleTeam: (abbr) =>
    set((s) => ({
      selectedTeams: s.selectedTeams.includes(abbr)
        ? s.selectedTeams.filter((a) => a !== abbr)
        : [...s.selectedTeams, abbr]
    })),
  selectAll: () => set({ selectedTeams: NBA_TEAMS.map((t) => t.abbr) }),
  deselectAll: () => set({ selectedTeams: [] }),
  toggleAddFictional: () => set((s) => ({ showAddFictional: !s.showAddFictional })),
  setNewTeamField: (field, value) =>
    set((s) => ({
      newTeam: {
        ...s.newTeam,
        [field]: field === 'abbr' ? value.toUpperCase().slice(0, 3) : value
      }
    })),
  addFictionalTeam: () =>
    set((s) => {
      const t = s.newTeam
      if (!t.name.trim() || !t.city.trim() || !t.abbr.trim()) return {}
      const team: FictionalTeam = { ...t, id: 'C' + Object.keys(s.fictionalTeams).length + '_' + t.abbr }
      return {
        fictionalTeams: [...s.fictionalTeams, team],
        showAddFictional: false,
        newTeam: emptyNewTeam()
      }
    }),

  pickMyTeam: (abbr) => set({ myTeam: abbr }),

  setPlayoffTeams: (n) => set({ playoffTeamsPerConf: n }),
  setRoundGames: (idx, games) =>
    set((s) => {
      const rg = [...s.roundGames]
      rg[idx] = games
      return { roundGames: rg }
    }),
  setSalaryCap: (n) => set({ salaryCap: n }),
  setHardCap: (v) => set({ hardCap: v }),

  reset: () => set(initialState()),

  buildLeagueConfig: () => {
    const s = get()
    return {
      leagueName: s.leagueName,
      teamsCount: s.selectedTeams.length + s.fictionalTeams.length,
      gamesPerSeason: s.gamesPerSeason,
      divsPerConf: s.divsPerConf,
      conferences: s.conferences,
      selectedTeams: s.selectedTeams,
      fictionalTeams: s.fictionalTeams,
      myTeam: s.myTeam ?? 'LAL',
      playoffTeamsPerConf: s.playoffTeamsPerConf,
      roundGames: s.roundGames,
      salaryCap: s.salaryCap,
      hardCap: s.hardCap
    }
  }
}))

export function getRoundCount(playoffTeamsPerConf: number): number {
  const n = Math.max(2, playoffTeamsPerConf)
  return Math.ceil(Math.log2(n)) + 1
}

export function getRoundLabel(i: number, total: number): string {
  if (i === total - 1) return 'Finals'
  if (i === total - 2) return 'Conf Finals'
  if (i === total - 3) return 'Conf Semifinals'
  if (i === 0) return 'First Round'
  return `Round ${i + 1}`
}

export { getTextColor }
