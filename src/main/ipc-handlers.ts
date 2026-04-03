import { ipcMain, BrowserWindow, shell } from 'electron'
import { getSettings, updateSettings, resetSettings } from './settings'

type DownloaderModule = typeof import('./downloader')
type DownloadManagerInstance = InstanceType<DownloaderModule['DownloadManager']>

let mainWindowRef: BrowserWindow | null = null
let downloadManager: DownloadManagerInstance | null = null
let downloaderModulePromise: Promise<DownloaderModule> | null = null

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  try {
    const serialized = JSON.stringify(error)
    return serialized === undefined ? fallback : serialized
  } catch {
    return fallback
  }
}

async function loadDownloaderModule(): Promise<DownloaderModule> {
  if (!downloaderModulePromise) {
    downloaderModulePromise = import('./downloader')
  }

  try {
    return await downloaderModulePromise
  } catch (error) {
    downloaderModulePromise = null
    throw error
  }
}

async function getDownloadManager(): Promise<DownloadManagerInstance> {
  if (!downloadManager) {
    const downloaderModule = await loadDownloaderModule()
    downloadManager = new downloaderModule.DownloadManager()
  }

  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    downloadManager.setMainWindow(mainWindowRef)
  }

  return downloadManager
}

function reportDownloadInitError(id: string | undefined, error: unknown): void {
  const errorMessage = getErrorMessage(error, 'Failed to initialize downloader module.')
  console.error('[IPC] Failed to initialize downloader module:', error)

  if (!mainWindowRef || mainWindowRef.isDestroyed()) {
    return
  }

  mainWindowRef.webContents.send('download-status', {
    id,
    status: 'error',
    errorMessage
  })
}

export function setupWindowEvents(win: BrowserWindow): void {
  mainWindowRef = win

  void getDownloadManager().catch((error) => {
    console.error('[IPC] Downloader warm-up skipped:', error)
  })

  const sendWindowState = (): void => {
    if (!win.isDestroyed()) {
      win.webContents.send('window-state-changed', {
        isMaximized: win.isMaximized(),
        isMinimized: win.isMinimized(),
        isFocused: win.isFocused()
      })
    }
  }

  ipcMain.on('window-minimize', () => {
    if (!win.isDestroyed()) win.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (!win.isDestroyed()) {
      win.isMaximized() ? win.unmaximize() : win.maximize()
    }
  })

  // Use destroy() instead of close() to avoid frameless-window crashes on newer Electron.
  ipcMain.on('window-close', () => {
    if (!win.isDestroyed()) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      }
      win.destroy()
    }
  })

  ipcMain.handle('get-window-state', () => {
    if (win.isDestroyed()) return null
    return {
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isFocused: win.isFocused()
    }
  })

  win.on('maximize', sendWindowState)
  win.on('unmaximize', sendWindowState)
  win.on('minimize', sendWindowState)
  win.on('restore', sendWindowState)
  win.on('focus', sendWindowState)
  win.on('blur', sendWindowState)
}

export function registerIpcHandlers(): void {
  ipcMain.handle('select-directory', async () => {
    const downloaderModule = await loadDownloaderModule()
    return downloaderModule.selectDirectory()
  })

  ipcMain.on('start-download', async (_event, item) => {
    try {
      const manager = await getDownloadManager()
      void manager.startDownload(item)
    } catch (error) {
      reportDownloadInitError(item?.id, error)
    }
  })

  ipcMain.on('pause-download', async (_event, id) => {
    try {
      const manager = await getDownloadManager()
      manager.pauseDownload(id)
    } catch (error) {
      reportDownloadInitError(id, error)
    }
  })

  ipcMain.on('resume-download', async (_event, id) => {
    try {
      const manager = await getDownloadManager()
      manager.resumeDownload(id)
    } catch (error) {
      reportDownloadInitError(id, error)
    }
  })

  ipcMain.on('cancel-download', async (_event, id) => {
    try {
      const manager = await getDownloadManager()
      manager.cancelDownload(id)
    } catch (error) {
      reportDownloadInitError(id, error)
    }
  })

  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.on('update-settings', (_event, settings) => {
    updateSettings(settings)
  })

  ipcMain.on('reset-settings', () => {
    resetSettings()
  })

  ipcMain.handle('open-file', async (_event, filePath: string) => {
    await shell.openPath(filePath)
  })

  ipcMain.handle('open-folder', async (_event, folderPath: string) => {
    await shell.openPath(folderPath)
  })
}
