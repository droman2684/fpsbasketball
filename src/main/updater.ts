import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

// Auto-update only makes sense for a packaged, installed build — a dev run
// has no publish feed to check against and no installer to relaunch into.
export function initAutoUpdater(): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] error:', err)
  })

  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: `Empire Hoops ${info.version} has been downloaded.`,
        detail: 'Restart now to install it, or it will install automatically the next time you quit.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[autoUpdater] checkForUpdates failed:', err)
  })
}
