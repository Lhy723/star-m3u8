import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface DownloadItem {
  id: string
  url: string
  filename: string
  savePath: string
  progress: number
  speed: string
  status: 'pending' | 'downloading' | 'paused' | 'merging' | 'completed' | 'error'
  errorMessage?: string
  totalSegments?: number
  downloadedSegments?: number
}

interface ProgressData {
  id: string
  progress: number
  speed: string
  downloadedSegments?: number
  totalSegments?: number
}

interface StatusData {
  id: string
  status: DownloadItem['status']
  totalSegments?: number
}

interface ErrorData {
  id: string
  error: string
}

const STORAGE_KEY = 'star-m3u8-settings'

function loadSettings(): { defaultPath: string } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore
  }
  return { defaultPath: '' }
}

function saveSettings(settings: { defaultPath: string }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const useDownloadStore = defineStore('download', () => {
  const settings = loadSettings()
  const defaultPath = ref(settings.defaultPath)
  const queue = ref<DownloadItem[]>([])
  const history = ref<DownloadItem[]>([])
  let unsubscribeProgress: (() => void) | null = null
  let unsubscribeStatus: (() => void) | null = null
  let unsubscribeError: (() => void) | null = null

  watch(defaultPath, (newPath) => {
    saveSettings({ defaultPath: newPath })
  })

  function addToQueue(item: DownloadItem): void {
    console.log('[DownloadStore] Adding to queue:', item)
    queue.value.push(item)
    window.electron?.ipcRenderer.send('start-download', item)
  }

  function updateProgress(
    id: string,
    progress: number,
    speed: string,
    downloadedSegments?: number,
    totalSegments?: number
  ): void {
    console.log('[DownloadStore] Update progress:', id, progress, speed)
    const item = queue.value.find((i) => i.id === id)
    if (item) {
      item.progress = progress
      item.speed = speed
      if (downloadedSegments !== undefined) {
        item.downloadedSegments = downloadedSegments
      }
      if (totalSegments !== undefined) {
        item.totalSegments = totalSegments
      }
    }
  }

  function updateStatus(id: string, status: DownloadItem['status'], totalSegments?: number): void {
    console.log('[DownloadStore] Update status:', id, status)
    const item = queue.value.find((i) => i.id === id)
    if (item) {
      item.status = status
      if (totalSegments !== undefined) {
        item.totalSegments = totalSegments
      }
      if (status === 'completed') {
        history.value.unshift({ ...item })
        removeFromQueue(id)
      }
    }
  }

  function removeFromQueue(id: string): void {
    const index = queue.value.findIndex((i) => i.id === id)
    if (index > -1) {
      queue.value.splice(index, 1)
    }
  }

  function pauseDownload(id: string): void {
    window.electron?.ipcRenderer.send('pause-download', id)
    updateStatus(id, 'paused')
  }

  function resumeDownload(id: string): void {
    window.electron?.ipcRenderer.send('resume-download', id)
    updateStatus(id, 'downloading')
  }

  function cancelDownload(id: string): void {
    window.electron?.ipcRenderer.send('cancel-download', id)
    removeFromQueue(id)
  }

  async function selectDirectory(): Promise<string | null> {
    const path = ((await window.electron?.ipcRenderer.invoke('select-directory')) as string) || null
    if (path) {
      defaultPath.value = path
    }
    return path
  }

  async function openFile(filePath: string): Promise<void> {
    await window.electron?.ipcRenderer.invoke('open-file', filePath)
  }

  async function openFolder(folderPath: string): Promise<void> {
    await window.electron?.ipcRenderer.invoke('open-folder', folderPath)
  }

  function init(): void {
    console.log('[DownloadStore] Initializing IPC listeners')

    unsubscribeProgress = window.electron?.ipcRenderer.on('download-progress', (data) => {
      console.log('[DownloadStore] Received progress:', data)
      const progressData = data as ProgressData
      updateProgress(
        progressData.id,
        progressData.progress,
        progressData.speed,
        progressData.downloadedSegments,
        progressData.totalSegments
      )
    })

    unsubscribeStatus = window.electron?.ipcRenderer.on('download-status', (data) => {
      console.log('[DownloadStore] Received status:', data)
      const statusData = data as StatusData
      updateStatus(statusData.id, statusData.status, statusData.totalSegments)
    })

    unsubscribeError = window.electron?.ipcRenderer.on('download-error', (data) => {
      console.log('[DownloadStore] Received error:', data)
      const errorData = data as ErrorData
      const item = queue.value.find((i) => i.id === errorData.id)
      if (item) {
        item.status = 'error'
        item.errorMessage = errorData.error
      }
    })
  }

  function dispose(): void {
    unsubscribeProgress?.()
    unsubscribeStatus?.()
    unsubscribeError?.()
    unsubscribeProgress = null
    unsubscribeStatus = null
    unsubscribeError = null
  }

  return {
    defaultPath,
    queue,
    history,
    addToQueue,
    updateProgress,
    updateStatus,
    removeFromQueue,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    selectDirectory,
    openFile,
    openFolder,
    init,
    dispose
  }
})
