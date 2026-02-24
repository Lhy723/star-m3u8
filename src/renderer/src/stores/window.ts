import { defineStore } from 'pinia'
import { ref } from 'vue'

interface WindowState {
  isMaximized: boolean
  isMinimized: boolean
  isFocused: boolean
}

export const useWindowStore = defineStore('window', () => {
  const isMaximized = ref(false)
  const isMinimized = ref(false)
  const isFocused = ref(true)
  let unsubscribe: (() => void) | null = null

  function syncState(state: WindowState): void {
    isMaximized.value = state.isMaximized
    isMinimized.value = state.isMinimized
    isFocused.value = state.isFocused
  }

  async function init(): Promise<void> {
    const state = (await window.electron?.ipcRenderer.invoke('get-window-state')) as
      | WindowState
      | undefined
    if (state) syncState(state)

    unsubscribe = window.electron?.ipcRenderer.on('window-state-changed', (data) => {
      const windowState = data as WindowState
      syncState(windowState)
    })
  }

  function dispose(): void {
    unsubscribe?.()
    unsubscribe = null
  }

  function minimize(): void {
    isMinimized.value = true
    window.electron?.ipcRenderer.send('window-minimize')
  }

  function maximize(): void {
    isMaximized.value = true
    window.electron?.ipcRenderer.send('window-maximize')
  }

  function unmaximize(): void {
    isMaximized.value = false
    window.electron?.ipcRenderer.send('window-maximize')
  }

  function toggleMaximize(): void {
    isMaximized.value = !isMaximized.value
    window.electron?.ipcRenderer.send('window-maximize')
  }

  function close(): void {
    window.electron?.ipcRenderer.send('window-close')
  }

  return {
    isMaximized,
    isMinimized,
    isFocused,
    init,
    dispose,
    minimize,
    maximize,
    unmaximize,
    toggleMaximize,
    close
  }
})
