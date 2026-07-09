import { ElectronAPI } from '@electron-toolkit/preload'
import type { LeagueApi } from '@shared/ipcChannels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: LeagueApi
  }
}
