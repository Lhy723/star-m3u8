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

type StoreLike = {
  store: Settings
  set: (key: keyof Settings, value: Settings[keyof Settings]) => void
  clear: () => void
}

function createFallbackStore(): StoreLike {
  const state: Settings = { ...defaults }
  return {
    get store() {
      return state
    },
    set(key, value) {
      state[key] = value as never
    },
    clear() {
      Object.assign(state, defaults)
    }
  }
}

function createSettingsStore(): StoreLike {
  try {
    return new Store<Settings>({
      name: 'settings',
      defaults
    }) as unknown as StoreLike
  } catch (error) {
    console.error('[Settings] Failed to initialize electron-store, using in-memory defaults:', error)
    return createFallbackStore()
  }
}

const settingsStore = createSettingsStore()

export const getSettings = (): Settings => settingsStore.store as Settings

export const updateSettings = (updates: Partial<Settings>): void => {
  for (const [rawKey, value] of Object.entries(updates)) {
    const key = rawKey as keyof Settings
    if (value !== undefined) {
      settingsStore.set(key, value)
    }
  }
}

export const resetSettings = (): void => {
  settingsStore.clear()
}
