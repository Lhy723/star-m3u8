declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        send: (channel: string, ...args: unknown[]) => void
        on: (channel: string, listener: (...args: unknown[]) => void) => () => void
      }
      // 在默认浏览器中打开外部链接
      openExternal: (url: string) => Promise<void>
    }
  }
}

export {}
