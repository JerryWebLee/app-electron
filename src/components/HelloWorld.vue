<script setup lang="ts">
import { useMainStore } from '../store'
import { storeToRefs } from 'pinia'

const store = useMainStore()
const { count } = storeToRefs(store)
</script>

<template>
  <div class="card p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold text-white mb-4">Electron + Vue 3 + Element Plus + Tailwind CSS 4</h1>
    <el-button type="primary" @click="store.increment" class="mb-4">Count is {{ count }}</el-button>
    <p class="text-white/90">
      Edit
      <code class="bg-black/20 px-2 py-1 rounded">components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped lang="less">
.read-the-docs {
  color: #888;
}
</style>
