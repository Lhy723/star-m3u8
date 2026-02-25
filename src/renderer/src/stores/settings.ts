import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AppSettings {
  defaultDownloadPath: string
  theme: 'light' | 'dark' | 'auto'
  concurrent: string
  retry: string
}

export const useSettingsStore = defineStore('settings', () => {
  const defaultDownloadPath = ref('')
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const concurrent = ref('4')
  const retry = ref('3')

  const loadSettings = async () => {
    const settings = (await window.electron?.ipcRenderer.invoke('get-settings')) as AppSettings | undefined
    if (settings) {
      defaultDownloadPath.value = settings.defaultDownloadPath || ''
      theme.value = settings.theme || 'auto'
      concurrent.value = settings.concurrent || '4'
      retry.value = settings.retry || '3'
    }
  }

  const saveSettings = () => {
    window.electron?.ipcRenderer.send('update-settings', {
      defaultDownloadPath: defaultDownloadPath.value,
      theme: theme.value,
      concurrent: concurrent.value,
      retry: retry.value
    })
  }

  const resetSettings = () => {
    defaultDownloadPath.value = ''
    theme.value = 'auto'
    concurrent.value = '4'
    retry.value = '3'
    window.electron?.ipcRenderer.send('reset-settings')
  }

  return {
    defaultDownloadPath,
    theme,
    concurrent,
    retry,
    loadSettings,
    saveSettings,
    resetSettings
  }
})
