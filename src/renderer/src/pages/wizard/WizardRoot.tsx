import type { LeagueConfig, PersistedSave } from '@shared/types'
import { useWizardStore } from '@renderer/state/wizardStore'
import Landing from './Landing'
import Wizard from './Wizard'
import LoadLeague from './LoadLeague'

interface WizardRootProps {
  onLaunch: (config: LeagueConfig) => void
  onLoad: (save: PersistedSave) => void
}

// The only entry point another pass should import: reads which of the three
// top-level screens (landing / creation wizard / load-league picker) is
// active and renders it.
export default function WizardRoot({ onLaunch, onLoad }: WizardRootProps): React.JSX.Element {
  const page = useWizardStore((s) => s.page)

  if (page === 'wizard') {
    return <Wizard onLaunch={() => onLaunch(useWizardStore.getState().buildLeagueConfig())} />
  }
  if (page === 'load') {
    return <LoadLeague onLoad={onLoad} />
  }
  return <Landing />
}
