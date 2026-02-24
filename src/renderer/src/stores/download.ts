import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DownloadItem {
  id: string
  url: string
  filename: string
  path: string
  progress: number
  speed: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  errorMessage?: string
}

export const useDownloadStore = defineStore('download', () => {
  const queue = ref<DownloadItem[]>([])
  const history = ref<DownloadItem[]>([])
  let unsubscribeProgress: (() => void) | null = null
  let unsubscribeStatus: (() => void) | null = null
  let unsubscribeError: (() => void) | null = null

  const addToQueue = (item: DownloadItem) => {
    queue.value.push(item)
    window.electron?.ipcRenderer.send('start-download', item)
  }

  const updateProgress = (id: string, progress: number, speed: string) => {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      item.progress = progress
      item.speed = speed
    }
  }

  const updateStatus = (id: string, status: DownloadItem['status']) => {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      item.status = status
      if (status === 'completed') {
        history.value.unshift({ ...item })
      }
    }
  }

  const removeFromQueue = (id: string) => {
    const index = queue.value.findIndex(i => i.id === id)
    if (index > -1) {
      queue.value.splice(index, 1)
    }
  }

  const pauseDownload = (id: string) => {
    window.electron?.ipcRenderer.send('pause-download', id)
    updateStatus(id, 'paused')
  }

  const resumeDownload = (id: string) => {
    window.electron?.ipcRenderer.send('resume-download', id)
    updateStatus(id, 'downloading')
  }

  const cancelDownload = (id: string) => {
    window.electron?.ipcRenderer.send('cancel-download', id)
    removeFromQueue(id)
  }

  const selectDirectory = async (): Promise<string | null> => {
    return await window.electron?.ipcRenderer.invoke('select-directory') || null
  }

  const init = () => {
    unsubscribeProgress = window.electron?.ipcRenderer.on(
      'download-progress',
      (_: unknown, data: { id: string; progress: number; speed: string }) => {
        updateProgress(data.id, data.progress, data.speed)
      }
    )

    unsubscribeStatus = window.electron?.ipcRenderer.on(
      'download-status',
      (_: unknown, data: { id: string; status: DownloadItem['status'] }) => {
        updateStatus(data.id, data.status)
      }
    )

    unsubscribeError = window.electron?.ipcRenderer.on(
      'download-error',
      (_: unknown, data: { id: string; error: string }) => {
        const item = queue.value.find(i => i.id === data.id)
        if (item) {
          item.status = 'error'
          item.errorMessage = data.error
        }
      }
    )
  }

  const dispose = () => {
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
