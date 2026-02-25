import Store from 'electron-store'

interface Settings {
  defaultDownloadPath: string
  theme: 'light' | 'dark' | 'auto'
  concurrent: string
  retry: string
}

const defaults: Settings = {
  defaultDownloadPath: '',
  theme: 'auto',
  concurrent: '4',
  retry: '3'
}

const settingsStore = new Store<Settings>({
  name: 'settings',
  defaults
})

export const getSettings = (): Settings => settingsStore.store as Settings

export const updateSettings = (updates: Partial<Settings>): void => {
  for (const [key, value] of Object.entries(updates)) {
    settingsStore.set(key, value)
  }
}

export const resetSettings = (): void => {
  settingsStore.clear()
}
