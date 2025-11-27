<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElButton } from 'element-plus'

interface Node {
  topic: string
  id?: string
  children?: Node[]
  expanded?: boolean
  note?: string
  icons?: string[]
}

const props = defineProps<{
  nodeData: Node | null
}>()

const emit = defineEmits<{
  (e: 'select', node: Node): void
  (e: 'toggle', node: Node): void
}>()

// 展开/收起节点
const toggleNode = (node: Node) => {
  node.expanded = !node.expanded
  emit('toggle', node)
}

// 选择节点
const selectNode = (node: Node) => {
  emit('select', node)
}

// 渲染节点树
const renderNode = (node: Node, level: number = 0): any => {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = node.expanded !== false // 默认展开

  return {
    node,
    level,
    hasChildren,
    isExpanded,
  }
}

// 扁平化节点树
const flattenNodes = (node: Node | null, level: number = 0, result: any[] = []): any[] => {
  if (!node) return result

  const nodeInfo = renderNode(node, level)
  result.push(nodeInfo)

  if (nodeInfo.isExpanded && node.children) {
    node.children.forEach((child) => {
      flattenNodes(child, level + 1, result)
    })
  }

  return result
}

// 扁平化的节点列表
const nodeList = computed(() => {
  if (!props.nodeData) return []
  return flattenNodes(props.nodeData, 0)
})
</script>

<template>
  <div class="outline-view">
    <div class="outline-header">
      <h3>大纲视图</h3>
      <div class="outline-actions">
        <el-button size="small" text>全部展开</el-button>
        <el-button size="small" text>全部收起</el-button>
      </div>
    </div>

    <div class="outline-content">
      <div
        v-for="(item, index) in nodeList"
        :key="item.node.id || index"
        class="outline-item"
        :style="{ paddingLeft: `${item.level * 20 + 12}px` }"
        @click="selectNode(item.node)"
      >
        <div class="outline-item-content">
          <span
            v-if="item.hasChildren"
            class="expand-icon"
            @click.stop="toggleNode(item.node)"
          >
            {{ item.isExpanded ? '▼' : '▶' }}
          </span>
          <span v-else class="expand-icon-placeholder"></span>

          <span class="node-icons">
            <span v-for="(icon, i) in item.node.icons" :key="i" class="node-icon">{{ icon }}</span>
          </span>

          <span class="node-topic">{{ item.node.topic }}</span>

          <span v-if="item.node.note" class="node-note-indicator" title="有备注">📝</span>
        </div>
      </div>

      <div v-if="nodeList.length === 0" class="empty-state">
        <p>暂无内容</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.outline-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.outline-actions {
  display: flex;
  gap: 8px;
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.outline-item {
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  &.selected {
    background: #ecf5ff;
  }
}

.outline-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-height: 32px;
}

.expand-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: #409eff;
  }
}

.expand-icon-placeholder {
  width: 16px;
  height: 16px;
}

.node-icons {
  display: flex;
  gap: 4px;
}

.node-icon {
  font-size: 14px;
}

.node-topic {
  flex: 1;
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.node-note-indicator {
  font-size: 12px;
  opacity: 0.6;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}
</style>

