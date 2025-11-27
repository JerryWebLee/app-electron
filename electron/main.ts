import { app, BrowserWindow, dialog, ipcMain } from 'electron/main'
import path from 'path'
import fs from 'fs'

// The built directory structure
//
// ├─┬─ dist
// │ └── index.html
// │
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
// 在打包后，需要使用 app.getAppPath() 来获取正确的应用路径
// 开发模式下，__dirname 指向 dist-electron 目录
// 打包后，__dirname 指向 app.asar/dist-electron 目录，而 dist 在 app.asar/dist
if (app.isPackaged) {
  // 打包后：app.getAppPath() 返回 app.asar 的路径
  process.env.DIST = path.join(app.getAppPath(), 'dist')
  process.env.VITE_PUBLIC = process.env.DIST
} else {
  // 开发模式：__dirname 指向 dist-electron 目录
  process.env.DIST = path.join(__dirname, '../dist')
  process.env.VITE_PUBLIC = path.join(__dirname, '../public')
}

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// 日志文件路径
const logDir = app.getPath('logs')
const logFile = path.join(logDir, 'app-electron.log')

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

/**
 * 日志工具函数
 * 将日志同时输出到控制台和文件
 */
function log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`

  // 输出到控制台
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `[${timestamp}] [${level.toUpperCase()}]`,
    message,
    ...args,
  )

  // 写入日志文件
  try {
    fs.appendFileSync(logFile, logMessage, 'utf8')
  } catch (err) {
    console.error('写入日志文件失败:', err)
  }
}

// 导出日志函数供其他模块使用
export const logger = {
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
}

// 记录应用启动信息
logger.info('应用启动', {
  isPackaged: app.isPackaged,
  version: app.getVersion(),
  platform: process.platform,
  logFile: logFile,
  appPath: app.getAppPath(),
  distPath: process.env.DIST,
  __dirname: __dirname,
})

function createWindow() {
  // 获取 preload 脚本路径
  const preloadPath = path.join(__dirname, 'preload.js')
  logger.debug('Preload 脚本路径', { preloadPath, exists: fs.existsSync(preloadPath) })

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: preloadPath,
      // 在开发模式下启用 nodeIntegration（仅用于调试）
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 在开发模式下自动打开开发者工具
  if (!app.isPackaged || process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools()
    logger.debug('开发者工具已打开')
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    logger.info('窗口加载完成')
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // 监听窗口错误
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logger.error('窗口加载失败', { errorCode, errorDescription })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    logger.info('加载开发服务器', { url: VITE_DEV_SERVER_URL })
  } else {
    // win.loadFile('dist/index.html')
    const indexPath = path.join(process.env.DIST as string, 'index.html')
    const indexPathExists = fs.existsSync(indexPath)
    logger.info('加载本地文件', {
      path: indexPath,
      exists: indexPathExists,
      distPath: process.env.DIST,
    })

    if (!indexPathExists) {
      logger.error('index.html 文件不存在', {
        indexPath,
        distPath: process.env.DIST,
        filesInDist: fs.existsSync(process.env.DIST as string)
          ? fs.readdirSync(process.env.DIST as string)
          : 'dist 目录不存在',
      })
    }

    win.loadFile(indexPath)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭')
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  logger.debug('应用激活')
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// 监听应用退出
app.on('before-quit', () => {
  logger.info('应用即将退出')
})

app.on('will-quit', () => {
  logger.info('应用退出')
})

// 监听未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack })
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', { reason, promise })
})

// 文件操作 IPC 处理器
// 新建文件
ipcMain.handle('file:new', async () => {
  try {
    return { success: true, data: null }
  } catch (error) {
    logger.error('新建文件失败', error)
    return { success: false, error: String(error) }
  }
})

// 打开文件
ipcMain.handle('file:open', async () => {
  try {
    if (!win) return { success: false, error: '窗口未初始化' }

    const result = await dialog.showOpenDialog(win, {
      title: '打开思维导图文件',
      filters: [
        { name: 'XMind 文件', extensions: ['xmind', 'json'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled) {
      return { success: false, canceled: true }
    }

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')

    return {
      success: true,
      data: {
        path: filePath,
        content: JSON.parse(content),
      },
    }
  } catch (error) {
    logger.error('打开文件失败', error)
    return { success: false, error: String(error) }
  }
})

// 保存文件
ipcMain.handle('file:save', async (_event, filePath: string | null, data: unknown) => {
  try {
    let targetPath = filePath

    // 如果没有指定路径，显示保存对话框
    if (!targetPath && win) {
      const result = await dialog.showSaveDialog(win, {
        title: '保存思维导图文件',
        defaultPath: 'untitled.xmind',
        filters: [
          { name: 'XMind 文件', extensions: ['xmind'] },
          { name: 'JSON 文件', extensions: ['json'] },
        ],
      })

      if (result.canceled) {
        return { success: false, canceled: true }
      }

      targetPath = result.filePath
    }

    if (!targetPath) {
      return { success: false, error: '未指定保存路径' }
    }

    // 确保目录存在
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 保存文件
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8')

    logger.info('文件保存成功', { path: targetPath })
    return { success: true, path: targetPath }
  } catch (error) {
    logger.error('保存文件失败', error)
    return { success: false, error: String(error) }
  }
})

// 另存为
ipcMain.handle('file:saveAs', async (_event, data: unknown) => {
  try {
    if (!win) return { success: false, error: '窗口未初始化' }

    const result = await dialog.showSaveDialog(win, {
      title: '另存为',
      defaultPath: 'untitled.xmind',
      filters: [
        { name: 'XMind 文件', extensions: ['xmind'] },
        { name: 'JSON 文件', extensions: ['json'] },
      ],
    })

    if (result.canceled) {
      return { success: false, canceled: true }
    }

    const filePath = result.filePath
    if (!filePath) {
      return { success: false, error: '未指定保存路径' }
    }

    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 保存文件
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')

    logger.info('文件另存为成功', { path: filePath })
    return { success: true, path: filePath }
  } catch (error) {
    logger.error('另存为失败', error)
    return { success: false, error: String(error) }
  }
})

// 导出为图片
ipcMain.handle('file:exportImage', async (_event, imageData: string, format: 'png' | 'jpg' = 'png') => {
  try {
    if (!win) return { success: false, error: '窗口未初始化' }

    const result = await dialog.showSaveDialog(win, {
      title: '导出图片',
      defaultPath: `export.${format}`,
      filters: [
        { name: 'PNG 图片', extensions: ['png'] },
        { name: 'JPG 图片', extensions: ['jpg', 'jpeg'] },
      ],
    })

    if (result.canceled) {
      return { success: false, canceled: true }
    }

    const filePath = result.filePath
    if (!filePath) {
      return { success: false, error: '未指定保存路径' }
    }

    // 将 base64 数据转换为 Buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // 保存文件
    fs.writeFileSync(filePath, buffer)

    logger.info('导出图片成功', { path: filePath })
    return { success: true, path: filePath }
  } catch (error) {
    logger.error('导出图片失败', error)
    return { success: false, error: String(error) }
  }
})

// 获取用户数据目录
ipcMain.handle('app:getUserDataPath', async () => {
  try {
    const userDataPath = app.getPath('userData')
    const mindMapDir = path.join(userDataPath, 'mindmaps')

    // 确保目录存在
    if (!fs.existsSync(mindMapDir)) {
      fs.mkdirSync(mindMapDir, { recursive: true })
    }

    return { success: true, path: mindMapDir }
  } catch (error) {
    logger.error('获取用户数据目录失败', error)
    return { success: false, error: String(error) }
  }
})

// 自动保存到本地缓存
ipcMain.handle('file:autoSave', async (_event, data: unknown) => {
  try {
    const userDataPath = app.getPath('userData')
    const autoSaveDir = path.join(userDataPath, 'autosave')

    // 确保目录存在
    if (!fs.existsSync(autoSaveDir)) {
      fs.mkdirSync(autoSaveDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const autoSavePath = path.join(autoSaveDir, `autosave-${timestamp}.json`)

    fs.writeFileSync(autoSavePath, JSON.stringify(data, null, 2), 'utf-8')

    // 只保留最近 10 个自动保存文件
    const files = fs.readdirSync(autoSaveDir)
      .filter(f => f.startsWith('autosave-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(autoSaveDir, f),
        time: fs.statSync(path.join(autoSaveDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)

    // 删除超过 10 个的文件
    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(file.path)
      })
    }

    return { success: true, path: autoSavePath }
  } catch (error) {
    logger.error('自动保存失败', error)
    return { success: false, error: String(error) }
  }
})

app.whenReady().then(() => {
  logger.info('应用准备就绪')
  createWindow()
})
