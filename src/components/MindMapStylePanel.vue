<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElColorPicker, ElInputNumber, ElSelect, ElOption, ElInput, ElButton, ElDivider, ElMessage } from 'element-plus'

interface NodeStyle {
  fontSize?: number
  color?: string
  background?: string
  shape?: 'rounded' | 'rect' | 'ellipse'
}

interface NodeData {
  topic: string
  note?: string
  hyperlink?: string
  icons?: string[]
  tags?: string[]
  style?: NodeStyle
}

const props = defineProps<{
  node: NodeData | null
}>()

const emit = defineEmits<{
  (e: 'update:node', node: NodeData): void
  (e: 'close'): void
}>()

// 样式状态
const style = ref<NodeStyle>({
  fontSize: 16,
  color: '#3298db',
  background: '#ecf0f1',
  shape: 'rounded',
})

// 节点属性
const topic = ref('')
const note = ref('')
const hyperlink = ref('')

// 常用颜色预设
const colorPresets = [
  '#3298db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
  '#1abc9c', '#34495e', '#e67e22', '#3498db', '#27ae60',
]

// 常用背景色预设
const backgroundPresets = [
  '#ecf0f1', '#ffffff', '#fff9e6', '#e8f5e9', '#e3f2fd',
  '#fce4ec', '#f3e5f5', '#e0f2f1', '#fff3e0', '#f1f8e9',
]

// 常用图标
const iconPresets = [
  '⭐', '🔥', '💡', '✅', '❌', '⚠️', '📌', '📝', '📎', '🔗',
  '🎯', '💯', '🚀', '⭐', '❤️', '👍', '👎', '🎉', '📢', '🔔',
]

// 监听节点变化
watch(
  () => props.node,
  (newNode) => {
    if (newNode) {
      topic.value = newNode.topic || ''
      note.value = newNode.note || ''
      hyperlink.value = newNode.hyperlink || ''
      style.value = {
        fontSize: newNode.style?.fontSize || 16,
        color: newNode.style?.color || '#3298db',
        background: newNode.style?.background || '#ecf0f1',
        shape: newNode.style?.shape || 'rounded',
      }
    }
  },
  { immediate: true }
)

// 更新节点
const updateNode = () => {
  if (!props.node) return

  const updatedNode: NodeData = {
    ...props.node,
    topic: topic.value,
    note: note.value,
    hyperlink: hyperlink.value,
    style: { ...style.value },
  }

  emit('update:node', updatedNode)
}

// 应用样式
const applyStyle = () => {
  updateNode()
  ElMessage.success('样式已应用')
}

// 重置样式
const resetStyle = () => {
  style.value = {
    fontSize: 16,
    color: '#3298db',
    background: '#ecf0f1',
    shape: 'rounded',
  }
  updateNode()
}

// 添加图标
const addIcon = (icon: string) => {
  if (!props.node) return
  const icons = props.node.icons || []
  if (!icons.includes(icon)) {
    const updatedNode: NodeData = {
      ...props.node,
      icons: [...icons, icon],
    }
    emit('update:node', updatedNode)
  }
}

// 移除图标
const removeIcon = (icon: string) => {
  if (!props.node) return
  const icons = props.node.icons || []
  const updatedNode: NodeData = {
    ...props.node,
    icons: icons.filter((i) => i !== icon),
  }
  emit('update:node', updatedNode)
}
</script>

<template>
  <div class="style-panel">
    <div class="panel-header">
      <h3>节点样式</h3>
      <el-button text @click="$emit('close')">关闭</el-button>
    </div>

    <div class="panel-content">
      <!-- 主题文本 -->
      <div class="form-item">
        <label>主题文本</label>
        <el-input v-model="topic" placeholder="输入主题文本" @blur="updateNode" />
      </div>

      <!-- 字体大小 -->
      <div class="form-item">
        <label>字体大小</label>
        <el-input-number v-model="style.fontSize" :min="10" :max="72" @change="updateNode" />
      </div>

      <!-- 文字颜色 -->
      <div class="form-item">
        <label>文字颜色</label>
        <div class="color-selector">
          <el-color-picker v-model="style.color" @change="updateNode" />
          <div class="color-presets">
            <span
              v-for="color in colorPresets"
              :key="color"
              class="color-preset"
              :style="{ backgroundColor: color }"
              @click="style.color = color; updateNode()"
            ></span>
          </div>
        </div>
      </div>

      <!-- 背景颜色 -->
      <div class="form-item">
        <label>背景颜色</label>
        <div class="color-selector">
          <el-color-picker v-model="style.background" @change="updateNode" />
          <div class="color-presets">
            <span
              v-for="color in backgroundPresets"
              :key="color"
              class="color-preset"
              :style="{ backgroundColor: color }"
              @click="style.background = color; updateNode()"
            ></span>
          </div>
        </div>
      </div>

      <!-- 节点形状 -->
      <div class="form-item">
        <label>节点形状</label>
        <el-select v-model="style.shape" @change="updateNode">
          <el-option label="圆角矩形" value="rounded" />
          <el-option label="矩形" value="rect" />
          <el-option label="椭圆" value="ellipse" />
        </el-select>
      </div>

      <el-divider />

      <!-- 备注 -->
      <div class="form-item">
        <label>备注</label>
        <el-input
          v-model="note"
          type="textarea"
          :rows="3"
          placeholder="输入备注信息"
          @blur="updateNode"
        />
      </div>

      <!-- 超链接 -->
      <div class="form-item">
        <label>超链接</label>
        <el-input v-model="hyperlink" placeholder="输入链接地址" @blur="updateNode" />
      </div>

      <el-divider />

      <!-- 图标 -->
      <div class="form-item">
        <label>图标</label>
        <div class="icon-selector">
          <div class="icon-presets">
            <span
              v-for="icon in iconPresets"
              :key="icon"
              class="icon-preset"
              @click="addIcon(icon)"
            >
              {{ icon }}
            </span>
          </div>
          <div v-if="props.node?.icons && props.node.icons.length > 0" class="selected-icons">
            <span>已选图标：</span>
            <span
              v-for="icon in props.node.icons"
              :key="icon"
              class="selected-icon"
              @click="removeIcon(icon)"
            >
              {{ icon }} ×
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="applyStyle">应用样式</el-button>
        <el-button @click="resetStyle">重置</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.style-panel {
  width: 320px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
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

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-item {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
}

.color-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    transform: scale(1.1);
  }
}

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-preset {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
    transform: scale(1.1);
  }
}

.selected-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.selected-icon {
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    border-color: #f56c6c;
    background: #fef0f0;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}
</style>

