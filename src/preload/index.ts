import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/ipcChannels'
import type { LeagueApi } from '@shared/ipcChannels'

const api: LeagueApi = {
  save: (data) => ipcRenderer.invoke(IPC_CHANNELS.LEAGUE_SAVE, data),
  load: (id) => ipcRenderer.invoke(IPC_CHANNELS.LEAGUE_LOAD, id),
  list: () => ipcRenderer.invoke(IPC_CHANNELS.LEAGUE_LIST),
  delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.LEAGUE_DELETE, id)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
