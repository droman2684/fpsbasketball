import type { PersistedSave } from './types'

export const IPC_CHANNELS = {
  LEAGUE_SAVE: 'league:save',
  LEAGUE_LOAD: 'league:load',
  LEAGUE_LIST: 'league:list',
  LEAGUE_DELETE: 'league:delete'
} as const

export interface LeagueApi {
  save(data: PersistedSave): Promise<void>
  load(id: string): Promise<PersistedSave | null>
  list(): Promise<PersistedSave[]>
  delete(id: string): Promise<void>
}
