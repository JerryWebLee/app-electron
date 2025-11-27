import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 思维导图节点数据结构
export interface MindMapNode {
  topic: string // 主题文本
  id?: string // 节点 ID
  direction?: 'left' | 'right' // 方向（仅用于根节点）
  children?: MindMapNode[] // 子节点
  expanded?: boolean // 是否展开
  style?: {
    fontSize?: number
    color?: string
    background?: string
    shape?: 'rounded' | 'rect' | 'ellipse'
  }
  note?: string // 备注
  hyperlink?: string // 超链接
  icons?: string[] // 图标
  tags?: string[] // 标签
}

// 思维导图数据结构
export interface MindMapData {
  nodeData: MindMapNode
  direction?: 'left' | 'right'
  theme?: string
  version?: string
}

export const useMindMapStore = defineStore('mindMap', () => {
  // 当前思维导图数据
  const currentData = ref<MindMapData | null>(null)

  // 当前文件路径
  const currentFilePath = ref<string | null>(null)

  // 是否已修改
  const isModified = ref(false)

  // 撤销/重做历史
  const history = ref<MindMapData[]>([])
  const historyIndex = ref(-1)

  // 自动保存定时器
  let autoSaveTimer: NodeJS.Timeout | null = null

  // 创建新的思维导图
  const createNew = () => {
    currentData.value = {
      nodeData: {
        topic: '中心主题',
        id: 'root',
        direction: 'right',
        children: [],
      },
      direction: 'right',
      version: '1.0',
    }
    currentFilePath.value = null
    isModified.value = false
    history.value = [JSON.parse(JSON.stringify(currentData.value))]
    historyIndex.value = 0
  }

  // 加载思维导图数据
  const loadData = (data: MindMapData, filePath?: string) => {
    currentData.value = data
    if (filePath) {
      currentFilePath.value = filePath
    }
    isModified.value = false
    history.value = [JSON.parse(JSON.stringify(data))]
    historyIndex.value = 0
  }

  // 更新思维导图数据
  const updateData = (data: MindMapData) => {
    currentData.value = data
    isModified.value = true

    // 添加到历史记录
    const newHistory = history.value.slice(0, historyIndex.value + 1)
    newHistory.push(JSON.parse(JSON.stringify(data)))
    history.value = newHistory
    historyIndex.value = newHistory.length - 1

    // 限制历史记录数量（最多 50 条）
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value = history.value.length - 1
    }

    // 触发自动保存
    triggerAutoSave()
  }

  // 标记为已保存
  const markAsSaved = (filePath?: string) => {
    isModified.value = false
    if (filePath) {
      currentFilePath.value = filePath
    }
  }

  // 撤销
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      currentData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      isModified.value = true
      triggerAutoSave()
      return true
    }
    return false
  }

  // 重做
  const redo = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      currentData.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
      isModified.value = true
      triggerAutoSave()
      return true
    }
    return false
  }

  // 触发自动保存
  const triggerAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(async () => {
      if (currentData.value && window.fileAPI) {
        try {
          await window.fileAPI.autoSave(currentData.value)
        } catch (error) {
          console.error('自动保存失败:', error)
        }
      }
    }, 2000) // 2 秒后自动保存
  }

  // 清理自动保存定时器
  const clearAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 计算属性：是否可以撤销
  const canUndo = computed(() => historyIndex.value > 0)

  // 计算属性：是否可以重做
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // 计算属性：是否有数据
  const hasData = computed(() => currentData.value !== null)

  return {
    // 状态
    currentData,
    currentFilePath,
    isModified,
    history,
    historyIndex,

    // 计算属性
    canUndo,
    canRedo,
    hasData,

    // 方法
    createNew,
    loadData,
    updateData,
    markAsSaved,
    undo,
    redo,
    clearAutoSave,
  }
})

