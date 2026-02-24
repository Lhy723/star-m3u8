import { dialog, BrowserWindow } from 'electron'

export async function selectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
}

export class DownloadManager {
  private tasks = new Map<string, any>()
  private mainWindow: BrowserWindow | null = null

  setMainWindow(win: BrowserWindow) {
    this.mainWindow = win
  }

  private send(channel: string, data: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  async startDownload(item: any): Promise<void> {
    console.log('Starting download:', item)
    this.tasks.set(item.id, item)
    
    this.send('download-status', { id: item.id, status: 'downloading' })
  }

  pauseDownload(id: string): void {
    console.log('Pausing download:', id)
    this.send('download-status', { id, status: 'paused' })
  }

  resumeDownload(id: string): void {
    console.log('Resuming download:', id)
    this.send('download-status', { id, status: 'downloading' })
  }

  cancelDownload(id: string): void {
    console.log('Canceling download:', id)
    this.tasks.delete(id)
  }

  reportProgress(id: string, progress: number, speed: string): void {
    this.send('download-progress', { id, progress, speed })
  }

  reportComplete(id: string): void {
    this.send('download-status', { id, status: 'completed' })
    this.tasks.delete(id)
  }

  reportError(id: string, error: string): void {
    this.send('download-error', { id, error })
    this.tasks.delete(id)
  }
}
