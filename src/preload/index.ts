import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron'

type IpcListener = (...args: unknown[]) => void

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
      ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: unknown[]): void => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: IpcListener): (() => void) => {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]): void => listener(...args)
      ipcRenderer.on(channel, subscription)
      return (): void => {
        ipcRenderer.removeListener(channel, subscription)
      }
    }
  },
  // 在默认浏览器中打开外部链接
  openExternal: (url: string): Promise<void> => shell.openExternal(url)
})
