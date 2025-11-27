<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import MindElixir from 'mind-elixir'
import 'mind-elixir/style.css'
import { useMindMapStore, type MindMapData } from '../store/mindMap'
import MindMapStylePanel from './MindMapStylePanel.vue'
import MindMapOutline from './MindMapOutline.vue'

const router = useRouter()
const mindMapStore = useMindMapStore()

// 容器引用
const containerRef = ref<HTMLElement | null>(null)
const mindElixirInstance = ref<InstanceType<typeof MindElixir> | null>(null)

// 视图模式
const viewMode = ref<'mindmap' | 'outline'>('mindmap')

// 是否显示大纲视图
const showOutline = ref(false)

// 搜索关键词
const searchKeyword = ref('')
const searchResults = ref<Array<{ node: unknown; path: string }>>([])

// 样式面板
const showStylePanel = ref(false)
const selectedNodeForStyle = ref<any>(null)

// 格式刷
const formatBrushSource = ref<any>(null)
const isFormatBrushActive = ref(false)

// 图片插入
const showImageDialog = ref(false)
const imageUrl = ref('')

// 初始化思维导图
onMounted(async () => {
  if (!containerRef.value) return

  // 如果没有数据，创建新的思维导图
  if (!mindMapStore.hasData) {
    mindMapStore.createNew()
  }

  // 初始化 MindElixir
  const data = convertToMindElixirData(mindMapStore.currentData!)
  mindElixirInstance.value = new MindElixir({
    el: containerRef.value,
    direction: mindMapStore.currentData?.direction === 'left' ? MindElixir.LEFT : MindElixir.SIDE,
    draggable: true,
    toolBar: false, // 使用自定义工具栏
    keypress: true,
    locale: 'zh_CN',
    mainLinkStyle: 2,
    overflowHidden: false,
  } as any) // 使用 any 避免类型检查问题

  // 初始化数据
  ;(mindElixirInstance.value as any).init(data)

  // 监听数据变化
  ;(mindElixirInstance.value as any).bus.addListener('operation', () => {
    // 思维导图数据发生变化
    const elixirData = (mindElixirInstance.value as any)?.getData()
    if (elixirData) {
      const mindMapData = convertFromMindElixirData(elixirData)
      mindMapStore.updateData(mindMapData)
    }
  })

  // 监听节点选择
  ;(mindElixirInstance.value as any).bus.addListener('selectNodes', (nodes: any[]) => {
    selectedNodes.value = nodes || []
    console.log('选中节点:', nodes)
    // 更新样式面板的选中节点
    if (nodes.length > 0) {
      selectedNodeForStyle.value = nodes[0]
    } else {
      selectedNodeForStyle.value = null
    }
  })

  // 监听节点双击编辑
  ;(mindElixirInstance.value as any).bus.addListener('beginEdit', (node: any) => {
    console.log('开始编辑节点:', node)
  })

  // 监听节点编辑完成
  ;(mindElixirInstance.value as any).bus.addListener('finishEdit', (node: any) => {
    console.log('完成编辑节点:', node)
    // 更新数据
    const elixirData = (mindElixirInstance.value as any)?.getData()
    if (elixirData) {
      const mindMapData = convertFromMindElixirData(elixirData)
      mindMapStore.updateData(mindMapData)
    }
  })
})

onBeforeUnmount(() => {
  mindMapStore.clearAutoSave()
  if (mindElixirInstance.value) {
    mindElixirInstance.value = null
  }
})

// 监听数据变化，同步到思维导图（仅在外部数据变化时更新，避免循环更新）
watch(
  () => mindMapStore.currentData,
  (newData) => {
    if (newData && mindElixirInstance.value) {
      const elixirData = convertToMindElixirData(newData)
      // 使用 refresh 而不是 init，避免重新初始化
      ;(mindElixirInstance.value as any).refresh(elixirData)
    }
  },
  { deep: false }, // 浅监听，避免频繁更新
)

// 转换 MindMapData 到 MindElixir 数据格式
function convertToMindElixirData(data: MindMapData): any {
  const convertNode = (node: any): any => {
    const elixirNode: any = {
      topic: node.topic,
      id: node.id || generateId(),
    }

    if (node.style) {
      elixirNode.style = {
        fontSize: node.style.fontSize?.toString() || '16',
        color: node.style.color || '#3298db',
        background: node.style.background || '#ecf0f1',
      }
    }

    if (node.note) {
      elixirNode.note = node.note
    }

    if (node.hyperlink) {
      elixirNode.hyperLink = node.hyperlink
    }

    if (node.icons && node.icons.length > 0) {
      elixirNode.icons = node.icons
    }

    if (node.tags && node.tags.length > 0) {
      elixirNode.tags = node.tags
    }

    if (node.children && node.children.length > 0) {
      elixirNode.children = node.children.map(convertNode)
    }

    return elixirNode
  }

  return {
    nodeData: convertNode(data.nodeData),
    direction: data.direction === 'left' ? MindElixir.LEFT : MindElixir.SIDE,
    theme: data.theme || 'default',
  }
}

// 转换 MindElixir 数据到 MindMapData
function convertFromMindElixirData(data: any): MindMapData {
  const convertNode = (node: any): any => {
    const mindMapNode: any = {
      topic: node.topic,
      id: node.id,
    }

    if (node.style) {
      mindMapNode.style = {
        fontSize: parseInt(node.style.fontSize) || 16,
        color: node.style.color,
        background: node.style.background,
        shape: 'rounded', // mind-elixir 默认使用圆角
      }
    }

    if (node.note) {
      mindMapNode.note = node.note
    }

    if (node.hyperLink) {
      mindMapNode.hyperlink = node.hyperLink
    }

    if (node.icons && node.icons.length > 0) {
      mindMapNode.icons = node.icons
    }

    if (node.tags && node.tags.length > 0) {
      mindMapNode.tags = node.tags
    }

    if (node.children && node.children.length > 0) {
      mindMapNode.children = node.children.map(convertNode)
    }

    return mindMapNode
  }

  return {
    nodeData: convertNode(data.nodeData),
    direction: data.direction === MindElixir.LEFT ? 'left' : 'right',
    theme: data.theme || 'default',
    version: '1.0',
  }
}

// 生成唯一 ID
function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 存储选中的节点（响应式）
const selectedNodes = ref<any[]>([])

// 添加同级主题
const addSibling = () => {
  if (!mindElixirInstance.value) return
  if (selectedNodes.value.length > 0) {
    const node = selectedNodes.value[0]
    ;(mindElixirInstance.value as any).insertSibling('新主题', node)
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 添加子主题
const addChild = () => {
  if (!mindElixirInstance.value) return
  if (selectedNodes.value.length > 0) {
    const node = selectedNodes.value[0]
    ;(mindElixirInstance.value as any).addChild('新子主题', node)
  } else {
    // 如果没有选中节点，选中根节点并添加
    const rootNode = mindElixirInstance.value.nodeData
    if (rootNode) {
      ;(mindElixirInstance.value as any).addChild('新子主题', rootNode)
    }
  }
}

// 删除节点
const deleteNode = () => {
  if (!mindElixirInstance.value) return
  if (selectedNodes.value.length > 0) {
    const rootNode = mindElixirInstance.value.nodeData
    const node = selectedNodes.value[0]
    if (node.id === rootNode.id) {
      ElMessage.warning('不能删除根节点')
      return
    }
    ;(mindElixirInstance.value as any).removeNodes([node])
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 复制节点
const copyNode = () => {
  if (selectedNodes.value.length > 0) {
    // 将节点数据存储到剪贴板
    const nodeData = JSON.stringify(selectedNodes.value[0])
    navigator.clipboard.writeText(nodeData).then(() => {
      ElMessage.success('节点已复制')
    })
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 粘贴节点
const pasteNode = async () => {
  if (!mindElixirInstance.value) return
  try {
    const clipboardText = await navigator.clipboard.readText()
    const nodeData = JSON.parse(clipboardText)
    if (selectedNodes.value.length > 0) {
      const selectedNode = selectedNodes.value[0]
      // 粘贴为子节点
      ;(mindElixirInstance.value as any).addChild(nodeData.topic || '新主题', selectedNode)
    } else {
      ElMessage.warning('请先选择一个节点')
    }
  } catch (error) {
    ElMessage.error('粘贴失败，剪贴板中没有有效的节点数据')
  }
}

// 撤销
const undo = () => {
  if (mindMapStore.undo()) {
    ElMessage.success('已撤销')
  } else {
    ElMessage.warning('无法撤销')
  }
}

// 重做
const redo = () => {
  if (mindMapStore.redo()) {
    ElMessage.success('已重做')
  } else {
    ElMessage.warning('无法重做')
  }
}

// 新建文件
const handleNew = async () => {
  if (mindMapStore.isModified) {
    try {
      await ElMessageBox.confirm('当前文件已修改，是否保存？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        type: 'warning',
      })
      await handleSave()
    } catch {
      // 用户选择不保存
    }
  }
  mindMapStore.createNew()
  if (mindElixirInstance.value) {
    const data = convertToMindElixirData(mindMapStore.currentData!)
    ;(mindElixirInstance.value as any).init(data)
  }
  ElMessage.success('已创建新文件')
}

// 打开文件
const handleOpen = async () => {
  if (!window.fileAPI) {
    ElMessage.error('文件 API 不可用')
    return
  }

  if (mindMapStore.isModified) {
    try {
      await ElMessageBox.confirm('当前文件已修改，是否保存？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        type: 'warning',
      })
      await handleSave()
    } catch {
      // 用户选择不保存
    }
  }

  try {
    const result = await window.fileAPI.open()
    if (result.success && result.data) {
      mindMapStore.loadData(result.data.content as MindMapData, result.data.path)
      if (mindElixirInstance.value) {
        const elixirData = convertToMindElixirData(mindMapStore.currentData!)
        ;(mindElixirInstance.value as any).init(elixirData)
      }
      ElMessage.success('文件打开成功')
    } else if (!result.canceled) {
      ElMessage.error(result.error || '打开文件失败')
    }
  } catch (error) {
    ElMessage.error('打开文件失败: ' + String(error))
  }
}

// 保存文件
const handleSave = async () => {
  if (!window.fileAPI) {
    ElMessage.error('文件 API 不可用')
    return
  }

  if (!mindMapStore.currentData) {
    ElMessage.warning('没有可保存的数据')
    return
  }

  try {
    const result = await window.fileAPI.save(mindMapStore.currentFilePath, mindMapStore.currentData)
    if (result.success && result.path) {
      mindMapStore.markAsSaved(result.path)
      ElMessage.success('文件保存成功')
    } else if (!result.canceled) {
      ElMessage.error(result.error || '保存文件失败')
    }
  } catch (error) {
    ElMessage.error('保存文件失败: ' + String(error))
  }
}

// 另存为
const handleSaveAs = async () => {
  if (!window.fileAPI) {
    ElMessage.error('文件 API 不可用')
    return
  }

  if (!mindMapStore.currentData) {
    ElMessage.warning('没有可保存的数据')
    return
  }

  try {
    const result = await window.fileAPI.saveAs(mindMapStore.currentData)
    if (result.success && result.path) {
      mindMapStore.markAsSaved(result.path)
      ElMessage.success('文件另存为成功')
    } else if (!result.canceled) {
      ElMessage.error(result.error || '另存为失败')
    }
  } catch (error) {
    ElMessage.error('另存为失败: ' + String(error))
  }
}

// 导出为图片
const handleExportImage = async () => {
  if (!mindElixirInstance.value || !window.fileAPI) {
    ElMessage.error('导出功能不可用')
    return
  }

  try {
    // 使用 html2canvas 或直接截图
    // 由于 mind-elixir 推荐使用 @ssshooter/modern-screenshot，我们使用简单的 canvas 方法
    const container = containerRef.value
    if (!container) {
      ElMessage.error('无法获取容器元素')
      return
    }

    // 使用 html2canvas 库（如果已安装）或使用简单的截图方法
    // 这里使用一个简单的实现：将 SVG 转换为图片
    const svgElement = container.querySelector('svg')
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const img = new Image()

      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width || 2000
        canvas.height = img.height || 1500
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          const imageData = canvas.toDataURL('image/png')
          const result = await window.fileAPI.exportImage(imageData, 'png')
          if (result.success && result.path) {
            ElMessage.success('图片导出成功')
          } else if (!result.canceled) {
            ElMessage.error(result.error || '导出图片失败')
          }
          URL.revokeObjectURL(url)
        }
      }

      img.onerror = () => {
        ElMessage.error('图片加载失败')
        URL.revokeObjectURL(url)
      }

      img.src = url
    } else {
      ElMessage.warning('未找到 SVG 元素，请确保思维导图已渲染')
    }
  } catch (error) {
    ElMessage.error('导出图片失败: ' + String(error))
  }
}

// 导出为 JSON
const handleExportJSON = () => {
  if (!mindMapStore.currentData) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const jsonStr = JSON.stringify(mindMapStore.currentData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mindmap.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('JSON 导出成功')
}

// 搜索功能
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }

  const keyword = searchKeyword.value.toLowerCase()
  const results: Array<{ node: unknown; path: string }> = []

  const searchNode = (node: any, path: string = '') => {
    const currentPath = path ? `${path} > ${node.topic}` : node.topic

    if (node.topic.toLowerCase().includes(keyword)) {
      results.push({ node, path: currentPath })
    }

    if (node.note && node.note.toLowerCase().includes(keyword)) {
      results.push({ node, path: currentPath })
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => {
        searchNode(child, currentPath)
      })
    }
  }

  if (mindMapStore.currentData) {
    searchNode(mindMapStore.currentData.nodeData)
  }

  searchResults.value = results
  if (results.length > 0) {
    ElMessage.success(`找到 ${results.length} 个匹配项`)
  } else {
    ElMessage.warning('未找到匹配项')
  }
}

// 定位到搜索结果节点
const locateNode = (result: { node: unknown; path: string }) => {
  if (!mindElixirInstance.value) return
  // MindElixir 的定位功能
  const node = result.node as any
  if (node && node.id) {
    const targetNode = MindElixir.E(node.id)
    if (targetNode) {
      ;(mindElixirInstance.value as any).selectNode(targetNode)
      ;(mindElixirInstance.value as any).toCenter()
    }
  }
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'mindmap' ? 'outline' : 'mindmap'
  showOutline.value = viewMode.value === 'outline'
}

// 打开样式面板
const openStylePanel = () => {
  if (selectedNodes.value.length > 0) {
    selectedNodeForStyle.value = selectedNodes.value[0]
    showStylePanel.value = true
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 关闭样式面板
const closeStylePanel = () => {
  showStylePanel.value = false
}

// 更新节点样式
const updateNodeStyle = (node: any) => {
  if (!mindElixirInstance.value) return

  // 更新节点数据
  const elixirData = (mindElixirInstance.value as any)?.getData()
  if (elixirData) {
    // 找到对应的节点并更新
    const updateNodeInData = (data: any, targetId: string) => {
      if (data.id === targetId) {
        Object.assign(data, node)
        return true
      }
      if (data.children) {
        for (const child of data.children) {
          if (updateNodeInData(child, targetId)) {
            return true
          }
        }
      }
      return false
    }

    updateNodeInData(elixirData.nodeData, node.id)

    // 刷新思维导图
    ;(mindElixirInstance.value as any).refresh(elixirData)

    // 更新 store
    const mindMapData = convertFromMindElixirData(elixirData)
    mindMapStore.updateData(mindMapData)
  }
}

// 格式刷：复制样式
const copyFormat = () => {
  if (selectedNodes.value.length > 0) {
    formatBrushSource.value = selectedNodes.value[0]
    isFormatBrushActive.value = true
    ElMessage.success('格式已复制，点击目标节点应用')
  } else {
    ElMessage.warning('请先选择一个节点')
  }
}

// 格式刷：应用样式
const applyFormat = (targetNode: any) => {
  if (!formatBrushSource.value || !mindElixirInstance.value) return

  const sourceStyle = formatBrushSource.value.style || {}

  // 应用样式到目标节点
  if (targetNode.style) {
    Object.assign(targetNode.style, sourceStyle)
  } else {
    targetNode.style = { ...sourceStyle }
  }

  // 更新思维导图
  const elixirData = (mindElixirInstance.value as any)?.getData()
  if (elixirData) {
    const mindMapData = convertFromMindElixirData(elixirData)
    mindMapStore.updateData(mindMapData)
  }

  isFormatBrushActive.value = false
  formatBrushSource.value = null
  ElMessage.success('格式已应用')
}

// 插入图片
const handleInsertImage = () => {
  if (selectedNodes.value.length === 0) {
    ElMessage.warning('请先选择一个节点')
    return
  }
  showImageDialog.value = true
}

// 确认插入图片
const confirmInsertImage = () => {
  if (!imageUrl.value.trim()) {
    ElMessage.warning('请输入图片地址')
    return
  }

  if (selectedNodes.value.length > 0 && mindElixirInstance.value) {
    const node = selectedNodes.value[0]
    // MindElixir 支持图片，需要设置 image 属性
    const elixirData = (mindElixirInstance.value as any)?.getData()
    if (elixirData) {
      const updateNodeImage = (data: any, targetId: string) => {
        if (data.id === targetId) {
          data.image = {
            url: imageUrl.value,
            width: 100,
            height: 100,
          }
          return true
        }
        if (data.children) {
          for (const child of data.children) {
            if (updateNodeImage(child, targetId)) {
              return true
            }
          }
        }
        return false
      }

      updateNodeImage(elixirData.nodeData, node.id)
      ;(mindElixirInstance.value as any).refresh(elixirData)

      const mindMapData = convertFromMindElixirData(elixirData)
      mindMapStore.updateData(mindMapData)

      showImageDialog.value = false
      imageUrl.value = ''
      ElMessage.success('图片已插入')
    }
  }
}

// 展开/收起节点
const toggleNodeExpand = (node: any) => {
  if (!mindElixirInstance.value) return // MindElixir 的展开/收起功能
  ;(mindElixirInstance.value as any).expandNode(node)
}

// 大纲视图中选择节点
const handleOutlineSelect = (node: any) => {
  if (!mindElixirInstance.value) return
  const targetNode = MindElixir.E(node.id)
  if (targetNode) {
    ;(mindElixirInstance.value as any).selectNode(targetNode)
    ;(mindElixirInstance.value as any).toCenter()
  }
}

// 大纲视图中切换展开
const handleOutlineToggle = (node: any) => {
  toggleNodeExpand(node)
}

// 缩放功能
const zoomIn = () => {
  if (mindElixirInstance.value) {
    ;(mindElixirInstance.value as any).scale(true)
  }
}

const zoomOut = () => {
  if (mindElixirInstance.value) {
    ;(mindElixirInstance.value as any).scale(false)
  }
}

const resetZoom = () => {
  if (mindElixirInstance.value) {
    ;(mindElixirInstance.value as any).scale(1)
  }
}

// 键盘快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + S: 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    handleSave()
    return
  }

  // Ctrl/Cmd + N: 新建
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    handleNew()
    return
  }

  // Ctrl/Cmd + O: 打开
  if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
    event.preventDefault()
    handleOpen()
    return
  }

  // Ctrl/Cmd + Z: 撤销
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
    return
  }

  // Ctrl/Cmd + Shift + Z: 重做
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) {
    event.preventDefault()
    redo()
    return
  }

  // Delete: 删除节点
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    deleteNode()
    return
  }

  // Tab: 添加子主题
  if (event.key === 'Tab') {
    event.preventDefault()
    addChild()
    return
  }

  // Enter: 添加同级主题
  if (event.key === 'Enter') {
    event.preventDefault()
    addSibling()
    return
  }
}

// 监听键盘事件
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="mindmap-container">
    <!-- 菜单栏 -->
    <div class="menu-bar">
      <div class="menu-group">
        <el-button-group>
          <el-button @click="handleNew" size="small">
            <span>新建</span>
          </el-button>
          <el-button @click="handleOpen" size="small">打开</el-button>
          <el-button @click="handleSave" size="small" :disabled="!mindMapStore.hasData">保存</el-button>
          <el-button @click="handleSaveAs" size="small" :disabled="!mindMapStore.hasData">另存为</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="undo" size="small" :disabled="!mindMapStore.canUndo">撤销</el-button>
          <el-button @click="redo" size="small" :disabled="!mindMapStore.canRedo">重做</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="addSibling" size="small">同级主题</el-button>
          <el-button @click="addChild" size="small">子主题</el-button>
          <el-button @click="deleteNode" size="small" type="danger">删除</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="copyNode" size="small">复制</el-button>
          <el-button @click="pasteNode" size="small">粘贴</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="zoomIn" size="small">放大</el-button>
          <el-button @click="zoomOut" size="small">缩小</el-button>
          <el-button @click="resetZoom" size="small">重置</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="openStylePanel" size="small" :disabled="selectedNodes.length === 0">样式</el-button>
          <el-button @click="copyFormat" size="small" :disabled="selectedNodes.length === 0">格式刷</el-button>
          <el-button @click="handleInsertImage" size="small" :disabled="selectedNodes.length === 0">插入图片</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="toggleViewMode" size="small">
            {{ viewMode === 'mindmap' ? '大纲视图' : '思维导图' }}
          </el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button-group>
          <el-button @click="handleExportImage" size="small" type="success">导出图片</el-button>
          <el-button @click="handleExportJSON" size="small" type="success">导出 JSON</el-button>
        </el-button-group>
      </div>

      <div class="menu-group">
        <el-button @click="router.push('/')" size="small" type="info">返回首页</el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="searchKeyword" placeholder="搜索主题..." size="small" clearable @keyup.enter="handleSearch">
        <template #append>
          <el-button @click="handleSearch" size="small">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 思维导图画布 -->
      <div v-show="!showOutline" ref="containerRef" class="mindmap-canvas"></div>

      <!-- 大纲视图 -->
      <MindMapOutline
        v-if="showOutline"
        :node-data="mindMapStore.currentData?.nodeData || null"
        @select="handleOutlineSelect"
        @toggle="handleOutlineToggle"
      />

      <!-- 样式面板 -->
      <MindMapStylePanel
        v-if="showStylePanel"
        :node="selectedNodeForStyle"
        @update:node="updateNodeStyle"
        @close="closeStylePanel"
      />

      <!-- 图片插入对话框 -->
      <el-dialog v-model="showImageDialog" title="插入图片" width="500px">
        <el-input v-model="imageUrl" placeholder="请输入图片 URL 或本地路径" />
        <template #footer>
          <el-button @click="showImageDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmInsertImage">确定</el-button>
        </template>
      </el-dialog>

      <!-- 搜索结果面板 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <h4>搜索结果 ({{ searchResults.length }})</h4>
        <ul>
          <li
            v-for="(result, index) in searchResults"
            :key="index"
            @click="locateNode(result)"
            class="search-result-item"
          >
            {{ result.path }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.mindmap-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #f5f5f5;
}

.menu-bar {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  align-items: center;
}

.menu-group {
  display: flex;
  align-items: center;
}

.search-bar {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.content-area {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.mindmap-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  background: #fff;
}

.outline-view {
  flex: 1;
  padding: 20px;
  background: #fff;
  overflow-y: auto;

  h3 {
    margin: 0 0 16px 0;
    font-size: 18px;
    color: #303133;
  }

  .outline-content {
    color: #909399;
  }
}

.search-results {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  z-index: 10;

  h4 {
    margin: 0;
    padding: 12px 16px;
    font-size: 14px;
    color: #303133;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .search-result-item {
    padding: 8px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    color: #606266;
    transition: background-color 0.2s;

    &:hover {
      background: #f5f7fa;
    }
  }
}
</style>
