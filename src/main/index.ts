import { app, shell, BrowserWindow, nativeImage, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

function formatFatalError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`
  }

  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  try {
    const serialized = JSON.stringify(error)
    return serialized === undefined ? 'Unknown fatal error' : serialized
  } catch {
    return 'Unknown fatal error'
  }
}

process.on('uncaughtException', (error) => {
  const message = formatFatalError(error)
  console.error('[Main] Uncaught exception:', message, error)
  dialog.showErrorBox('Application Startup Error', message)
})

process.on('unhandledRejection', (reason) => {
  const message = formatFatalError(reason)
  console.error('[Main] Unhandled rejection:', message, reason)
})

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

type IpcModule = typeof import('./ipc-handlers')

function isWritableDirectory(dirPath: string): boolean {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
    const marker = join(dirPath, `.write-test-${process.pid}-${Date.now()}`)
    fs.writeFileSync(marker, 'ok')
    fs.unlinkSync(marker)
    return true
  } catch {
    return false
  }
}

function configureUserDataPath(): void {
  const defaultUserDataPath = app.getPath('userData')
  if (isWritableDirectory(defaultUserDataPath)) {
    return
  }

  const fallbackCandidates = [
    join(app.getPath('appData'), `${app.getName()}-data`),
    join(app.getPath('temp'), `${app.getName()}-data`, 'user-data')
  ]

  for (const candidate of fallbackCandidates) {
    if (!isWritableDirectory(candidate)) {
      continue
    }

    app.setPath('userData', candidate)
    console.warn(
      `[Main] userData path is not writable, fallback path enabled. from="${defaultUserDataPath}" to="${candidate}"`
    )
    return
  }

  throw new Error(
    `Cannot access userData directory. default="${defaultUserDataPath}" fallback="${fallbackCandidates.join(', ')}"`
  )
}

function createWindow(setupWindowEvents?: IpcModule['setupWindowEvents']): void {
  const mainWindow = new BrowserWindow({
    minHeight: 600,
    minWidth: 1000,
    width: 1000,
    height: 600,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(icon),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (setupWindowEvents) {
    setupWindowEvents(mainWindow)
  }
}

try {
  configureUserDataPath()
} catch (error) {
  console.error('[Main] Failed to configure userData path:', error)
}

app.whenReady().then(async () => {
  try {
    electronApp.setAppUserModelId('com.electron')

    const ipcModule = await import('./ipc-handlers')
    ipcModule.registerIpcHandlers()

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow(ipcModule.setupWindowEvents)

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(ipcModule.setupWindowEvents)
    })
  } catch (error) {
    const message = formatFatalError(error)
    console.error('[Main] Failed to initialize application:', error)
    dialog.showErrorBox('Application Startup Error', message)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
