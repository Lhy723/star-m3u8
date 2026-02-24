import { defineStore } from 'pinia'
import { ref } from 'vue'

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

export const useDownloadStore = defineStore('download', () => {
  const queue = ref<DownloadItem[]>([])
  const history = ref<DownloadItem[]>([])
  let unsubscribeProgress: (() => void) | null = null
  let unsubscribeStatus: (() => void) | null = null
  let unsubscribeError: (() => void) | null = null

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
    return ((await window.electron?.ipcRenderer.invoke('select-directory')) as string) || null
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
    init,
    dispose
  }
})
