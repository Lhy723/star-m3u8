import { ipcMain, BrowserWindow } from 'electron'
import { selectDirectory, DownloadManager } from './downloader'
import { getSettings, updateSettings, resetSettings } from './settings'

const downloadManager = new DownloadManager()

export function setupWindowEvents(win: BrowserWindow) {
  downloadManager.setMainWindow(win)

  const sendWindowState = () => {
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

  // 使用 destroy() 代替 close()，避免 Electron 39.x 无框窗口在 Windows 上的崩溃问题
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

export function registerIpcHandlers() {
  // 目录选择
  ipcMain.handle('select-directory', () => selectDirectory())

  // 下载相关
  ipcMain.on('start-download', (_event, item) => {
    downloadManager.startDownload(item)
  })

  ipcMain.on('pause-download', (_event, id) => {
    downloadManager.pauseDownload(id)
  })

  ipcMain.on('resume-download', (_event, id) => {
    downloadManager.resumeDownload(id)
  })

  ipcMain.on('cancel-download', (_event, id) => {
    downloadManager.cancelDownload(id)
  })

  // 设置相关
  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.on('update-settings', (_event, settings) => {
    updateSettings(settings)
  })

  ipcMain.on('reset-settings', () => {
    resetSettings()
  })
}
