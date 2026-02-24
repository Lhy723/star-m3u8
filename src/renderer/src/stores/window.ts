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

  const syncState = (state: WindowState) => {
    isMaximized.value = state.isMaximized
    isMinimized.value = state.isMinimized
    isFocused.value = state.isFocused
  }

  const init = async () => {
    const state = await window.electron?.ipcRenderer.invoke('get-window-state')
    if (state) syncState(state)

    unsubscribe = window.electron?.ipcRenderer.on(
      'window-state-changed',
      (_: unknown, state: WindowState) => syncState(state)
    )
  }

  const dispose = () => {
    unsubscribe?.()
    unsubscribe = null
  }

  const minimize = () => {
    isMinimized.value = true
    window.electron?.ipcRenderer.send('window-minimize')
  }

  const maximize = () => {
    isMaximized.value = true
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const unmaximize = () => {
    isMaximized.value = false
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const toggleMaximize = () => {
    isMaximized.value = !isMaximized.value
    window.electron?.ipcRenderer.send('window-maximize')
  }

  const close = () => {
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
