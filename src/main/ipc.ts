import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipcChannels'
import type { PersistedSave } from '@shared/types'
import { getSnapshot, upsertSave, deleteSave } from './persistence'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LEAGUE_SAVE, (_event, data: PersistedSave) => {
    upsertSave(data)
  })
  ipcMain.handle(IPC_CHANNELS.LEAGUE_LOAD, (_event, id: string) => getSnapshot().saves.find((s) => s.id === id) ?? null)
  ipcMain.handle(IPC_CHANNELS.LEAGUE_LIST, () => getSnapshot().saves)
  ipcMain.handle(IPC_CHANNELS.LEAGUE_DELETE, (_event, id: string) => {
    deleteSave(id)
  })
}
