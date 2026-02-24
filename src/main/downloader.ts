import { dialog } from 'electron'

export async function selectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
}

export class DownloadManager {
  private tasks = new Map<string, any>()

  async startDownload(item: any): Promise<void> {
    console.log('Starting download:', item)
  }

  pauseDownload(id: string): void {
    console.log('Pausing download:', id)
  }

  resumeDownload(id: string): void {
    console.log('Resuming download:', id)
  }

  cancelDownload(id: string): void {
    console.log('Canceling download:', id)
    this.tasks.delete(id)
  }
}
