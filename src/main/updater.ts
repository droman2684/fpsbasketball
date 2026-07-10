import { app, dialog } from 'electron'
// electron-updater is CommonJS — under this project's ESM build, named
// imports don't interop correctly (throws "Named export 'autoUpdater' not
// found" at runtime even though it type-checks fine). Import the default and
// destructure instead.
import electronUpdater from 'electron-updater'
const { autoUpdater } = electronUpdater

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
