import { app, BrowserWindow } from 'electron'
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

app.whenReady().then(() => {
  logger.info('应用准备就绪')
  createWindow()
})
