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
}

export const useDownloadStore = defineStore('download', () => {
  const queue = ref<DownloadItem[]>([])
  const history = ref<DownloadItem[]>([])

  const addToQueue = (item: DownloadItem) => {
    queue.value.push(item)
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

  return {
    queue,
    history,
    addToQueue,
    updateProgress,
    updateStatus,
    removeFromQueue
  }
})
