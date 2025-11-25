<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/index.css'

const router = useRouter()
const containerRef = ref<HTMLElement | null>(null)
const lf = ref<LogicFlow | null>(null)

onMounted(() => {
  if (!containerRef.value) return

  lf.value = new LogicFlow({
    container: containerRef.value,
    grid: {
      type: 'dot',
      size: 20,
    },
    background: {
      backgroundColor: '#f7f9ff',
    },
    keyboard: {
      enabled: true,
    },
    style: {
      rect: {
        rx: 5,
        ry: 5,
        strokeWidth: 2,
      },
      circle: {
        r: 25,
        strokeWidth: 2,
      },
      diamond: {
        rx: 5,
        ry: 5,
        strokeWidth: 2,
      },
      polygon: {
        strokeWidth: 2,
      },
    },
  })

  // 初始化示例数据
  const data = {
    nodes: [
      {
        id: '1',
        type: 'rect',
        x: 100,
        y: 100,
        text: '开始',
        properties: {},
      },
      {
        id: '2',
        type: 'circle',
        x: 300,
        y: 100,
        text: '处理',
        properties: {},
      },
      {
        id: '3',
        type: 'diamond',
        x: 500,
        y: 100,
        text: '判断',
        properties: {},
      },
      {
        id: '4',
        type: 'rect',
        x: 700,
        y: 100,
        text: '结束',
        properties: {},
      },
    ],
    edges: [
      {
        id: 'edge1',
        type: 'polyline',
        sourceNodeId: '1',
        targetNodeId: '2',
        text: '流程1',
      },
      {
        id: 'edge2',
        type: 'polyline',
        sourceNodeId: '2',
        targetNodeId: '3',
        text: '流程2',
      },
      {
        id: 'edge3',
        type: 'polyline',
        sourceNodeId: '3',
        targetNodeId: '4',
        text: '流程3',
      },
    ],
  }

  lf.value.render(data)
})

onBeforeUnmount(() => {
  if (lf.value) {
    lf.value = null
  }
})

// 添加节点
const addNode = (type: string) => {
  if (!lf.value) return
  const node = {
    type,
    x: Math.random() * 500 + 200,
    y: Math.random() * 300 + 200,
    text: type === 'rect' ? '矩形' : type === 'circle' ? '圆形' : type === 'diamond' ? '菱形' : '多边形',
  }
  lf.value.addNode(node)
}

// 清空画布
const clearCanvas = () => {
  if (!lf.value) return
  lf.value.clearData()
}

// 撤销
const undo = () => {
  if (!lf.value) return
  lf.value.undo()
}

// 重做
const redo = () => {
  if (!lf.value) return
  lf.value.redo()
}

// 导出数据
const exportData = () => {
  if (!lf.value) return
  const data = lf.value.getGraphData()
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'flowchart.json'
  a.click()
  URL.revokeObjectURL(url)
}

// 导入数据
const importData = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !lf.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      lf.value?.render(data)
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入失败，请检查文件格式')
    }
  }
  reader.readAsText(file)
  target.value = ''
}

// 缩放
const zoomIn = () => {
  if (!lf.value) return
  lf.value.zoom(true)
}

const zoomOut = () => {
  if (!lf.value) return
  lf.value.zoom(false)
}

const resetZoom = () => {
  if (!lf.value) return
  lf.value.resetZoom()
}
</script>

<template>
  <div class="logic-flow-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-group">
        <el-button @click="router.push('/')" size="small" type="info">返回首页</el-button>
      </div>

      <div class="toolbar-group">
        <h3 class="toolbar-title">节点</h3>
        <el-button-group>
          <el-button @click="addNode('rect')" type="primary" size="small">
            <span>矩形</span>
          </el-button>
          <el-button @click="addNode('circle')" type="primary" size="small">
            <span>圆形</span>
          </el-button>
          <el-button @click="addNode('diamond')" type="primary" size="small">
            <span>菱形</span>
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-group">
        <h3 class="toolbar-title">操作</h3>
        <el-button-group>
          <el-button @click="undo" size="small">撤销</el-button>
          <el-button @click="redo" size="small">重做</el-button>
          <el-button @click="clearCanvas" size="small" type="danger">清空</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-group">
        <h3 class="toolbar-title">视图</h3>
        <el-button-group>
          <el-button @click="zoomIn" size="small">放大</el-button>
          <el-button @click="zoomOut" size="small">缩小</el-button>
          <el-button @click="resetZoom" size="small">重置</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-group">
        <h3 class="toolbar-title">数据</h3>
        <el-button-group>
          <el-button @click="exportData" size="small" type="success">导出</el-button>
          <el-button size="small" type="warning">
            <label for="import-file" style="cursor: pointer; margin: 0">导入</label>
            <input id="import-file" type="file" accept=".json" style="display: none" @change="importData" />
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 画布容器 -->
    <div ref="containerRef" class="flow-container"></div>
  </div>
</template>

<style scoped lang="less">
.logic-flow-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #fff;
}

.toolbar {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-title {
  margin: 0;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.flow-container {
  flex: 1;
  width: 100%;
  overflow: hidden;
}
</style>
