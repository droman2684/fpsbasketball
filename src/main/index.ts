import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { setMainWindow } from './windowRegistry'
import { getSnapshot, persist, persistNow } from './persistence'
import type { WindowBounds } from './persistence'

const DEFAULT_WIDTH = 1400
const DEFAULT_HEIGHT = 900
const MIN_WIDTH = 1024
const MIN_HEIGHT = 700

// A saved position from a display that's since been disconnected (external
// monitor unplugged, resolution changed) would otherwise reopen the window
// off-screen and invisible — only trust bounds whose center still falls
// within some currently-connected display's work area.
function isOnScreen(bounds: WindowBounds): boolean {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  return screen.getAllDisplays().some(({ workArea }) => {
    return (
      centerX >= workArea.x &&
      centerX <= workArea.x + workArea.width &&
      centerY >= workArea.y &&
      centerY <= workArea.y + workArea.height
    )
  })
}

function createWindow(): void {
  const savedBounds = getSnapshot().windowBounds
  const useSaved = savedBounds !== null && isOnScreen(savedBounds)

  const mainWindow = new BrowserWindow({
    width: useSaved ? Math.max(MIN_WIDTH, savedBounds!.width) : DEFAULT_WIDTH,
    height: useSaved ? Math.max(MIN_HEIGHT, savedBounds!.height) : DEFAULT_HEIGHT,
    x: useSaved ? savedBounds!.x : undefined,
    y: useSaved ? savedBounds!.y : undefined,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#F7F6F3',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  setMainWindow(mainWindow)

  const saveBounds = (): void => {
    getSnapshot().windowBounds = mainWindow.getBounds()
    persist()
  }
  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev) {
    mainWindow.webContents.on('console-message', (event) => {
      console.log(`[renderer] ${event.message}`)
    })
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Dev builds must never share a userData directory (and therefore never share
// empire-hoops-data.json) with the packaged app — otherwise local testing can
// read, overwrite, or race against a real user's actual save file.
app.setName(is.dev ? 'Empire Hoops Dev' : 'Empire Hoops')

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.empirehoops.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Writes are debounced (see persist() in persistence.ts) — flush synchronously
// before the process actually exits so a change made just before quitting is
// never silently lost.
app.on('before-quit', () => {
  persistNow()
})
