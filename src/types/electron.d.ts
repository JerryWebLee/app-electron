// Electron API 类型定义

export interface FileAPI {
  new: () => Promise<{ success: boolean; data: unknown; error?: string }>
  open: () => Promise<{ success: boolean; canceled?: boolean; data?: { path: string; content: unknown }; error?: string }>
  save: (filePath: string | null, data: unknown) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  saveAs: (data: unknown) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  exportImage: (imageData: string, format?: 'png' | 'jpg') => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
  autoSave: (data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>
}

export interface AppAPI {
  getUserDataPath: () => Promise<{ success: boolean; path?: string; error?: string }>
}

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      off: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
    fileAPI: FileAPI
    appAPI: AppAPI
  }
}

