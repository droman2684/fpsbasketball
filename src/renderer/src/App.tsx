import { useCallback, useEffect } from 'react'
import type { LeagueConfig, PersistedSave } from '@shared/types'
import { useGameStore, buildGameSnapshot } from '@renderer/state/gameStore'
import { useWizardStore } from '@renderer/state/wizardStore'
import WizardRoot from '@renderer/pages/wizard/WizardRoot'
import DashboardShell from '@renderer/components/dashboard/DashboardShell'

import Home from '@renderer/pages/dashboard/Home'
import Roster from '@renderer/pages/dashboard/Roster'
import DepthChart from '@renderer/pages/dashboard/DepthChart'
import Trades from '@renderer/pages/dashboard/Trades'
import TradeOffers from '@renderer/pages/dashboard/TradeOffers'
import FreeAgency from '@renderer/pages/dashboard/FreeAgency'
import Waivers from '@renderer/pages/dashboard/Waivers'
import SalaryCap from '@renderer/pages/dashboard/SalaryCap'
import Contracts from '@renderer/pages/dashboard/Contracts'
import GamePlan from '@renderer/pages/dashboard/GamePlan'
import Rotations from '@renderer/pages/dashboard/Rotations'
import Scouting from '@renderer/pages/dashboard/Scouting'
import Development from '@renderer/pages/dashboard/Development'
import Injuries from '@renderer/pages/dashboard/Injuries'
import Standings from '@renderer/pages/dashboard/Standings'
import Schedule from '@renderer/pages/dashboard/Schedule'
import Calendar from '@renderer/pages/dashboard/Calendar'
import PlayerStats from '@renderer/pages/dashboard/PlayerStats'
import TeamStats from '@renderer/pages/dashboard/TeamStats'
import Transactions from '@renderer/pages/dashboard/Transactions'
import BoxScore from '@renderer/pages/dashboard/BoxScore'
import AllStarGame from '@renderer/pages/dashboard/AllStarGame'
import Playoffs from '@renderer/pages/dashboard/Playoffs'
import LeagueRules from '@renderer/pages/dashboard/LeagueRules'
import SalaryCapRules from '@renderer/pages/dashboard/SalaryCapRules'
import DraftOrder from '@renderer/pages/dashboard/DraftOrder'
import Expansion from '@renderer/pages/dashboard/Expansion'
import RuleChanges from '@renderer/pages/dashboard/RuleChanges'
import DraftRoom from '@renderer/pages/dashboard/DraftRoom'
import Offseason from '@renderer/pages/dashboard/Offseason'

const PAGES: Record<string, React.ComponentType> = {
  home: Home,
  roster: Roster,
  depthChart: DepthChart,
  trades: Trades,
  tradeOffers: TradeOffers,
  freeAgency: FreeAgency,
  waivers: Waivers,
  salaryCap: SalaryCap,
  contracts: Contracts,
  gamePlan: GamePlan,
  rotations: Rotations,
  scouting: Scouting,
  development: Development,
  injuries: Injuries,
  standings: Standings,
  schedule: Schedule,
  calendar: Calendar,
  playerStats: PlayerStats,
  teamStats: TeamStats,
  transactions: Transactions,
  boxScore: BoxScore,
  allStarGame: AllStarGame,
  playoffs: Playoffs,
  leagueRules: LeagueRules,
  salaryCapRules: SalaryCapRules,
  draftOrder: DraftOrder,
  expansion: Expansion,
  ruleChanges: RuleChanges,
  draft: DraftRoom,
  offseason: Offseason
}

function Dashboard(): React.JSX.Element {
  const page = useGameStore((s) => s.page)
  const PageComponent = PAGES[page] ?? Home
  return (
    <DashboardShell>
      <PageComponent />
    </DashboardShell>
  )
}

export default function App(): React.JSX.Element {
  const initialized = useGameStore((s) => s.initialized)
  const initGame = useGameStore((s) => s.initGame)
  const loadSnapshot = useGameStore((s) => s.loadSnapshot)

  const handleLaunch = useCallback(
    (config: LeagueConfig) => {
      initGame(config)
      useWizardStore.getState().reset()
    },
    [initGame]
  )

  // Explicit resume, triggered by picking a specific save in the Load League
  // list — loading is a user action now, not something that auto-fires off
  // a page transition (multiple leagues can exist, so "the" save is gone).
  const handleLoadSave = useCallback(
    (save: PersistedSave) => {
      loadSnapshot(save.game)
      useGameStore.setState({ config: save.league, saveId: save.id, initialized: true })
      useWizardStore.getState().reset()
    },
    [loadSnapshot]
  )

  // Autosave on every game-state change, keyed to this league's own saveId
  // so multiple leagues' saves never collide or overwrite each other.
  useEffect(() => {
    if (!initialized) return
    const persistNow = (state: ReturnType<typeof useGameStore.getState>): void => {
      if (!state.config) return
      const save: PersistedSave = {
        id: state.saveId,
        version: 1,
        savedAt: new Date().toISOString(),
        league: state.config,
        game: buildGameSnapshot(state)
      }
      window.api.save(save).catch((err) => console.error('Autosave failed:', err))
    }
    persistNow(useGameStore.getState())
    return useGameStore.subscribe(persistNow)
  }, [initialized])

  if (!initialized) {
    return <WizardRoot onLaunch={handleLaunch} onLoad={handleLoadSave} />
  }

  return <Dashboard />
}
