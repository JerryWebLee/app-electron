import { ipcRenderer, contextBridge } from 'electron'

// 文件操作 API 类型定义
export interface FileAPI {
  new: () => Promise<{ success: boolean; data: unknown; error?: string }>
  open: () => Promise<{ success: boolean; canceled?: boolean; data?: { path: string; content: unknown }; error?: string }>
  save: (filePath: string | null, data: unknown) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  saveAs: (data: unknown) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  exportImage: (imageData: string, format?: 'png' | 'jpg') => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  autoSave: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>
}

// 应用 API 类型定义
export interface AppAPI {
  getUserDataPath: () => Promise<{ success: boolean; path?: string; error?: string }>
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// 暴露文件操作 API
contextBridge.exposeInMainWorld('fileAPI', {
  new: () => ipcRenderer.invoke('file:new'),
  open: () => ipcRenderer.invoke('file:open'),
  save: (filePath: string | null, data: unknown) => ipcRenderer.invoke('file:save', filePath, data),
  saveAs: (data: unknown) => ipcRenderer.invoke('file:saveAs', data),
  exportImage: (imageData: string, format?: 'png' | 'jpg') => ipcRenderer.invoke('file:exportImage', imageData, format),
  autoSave: (data: unknown) => ipcRenderer.invoke('file:autoSave', data),
} as FileAPI)

// 暴露应用 API
contextBridge.exposeInMainWorld('appAPI', {
  getUserDataPath: () => ipcRenderer.invoke('app:getUserDataPath'),
} as AppAPI)
