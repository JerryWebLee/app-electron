<script setup lang="ts">
import { useMainStore } from '../store'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const store = useMainStore()
const { count } = storeToRefs(store)
const router = useRouter()

const goToFlow = () => {
  router.push('/flow')
}
</script>

<template>
  <div class="home-container">
    <div class="card p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
      <h1 class="text-3xl font-bold text-white mb-4">Electron + Vue 3 + Element Plus + Tailwind CSS 4</h1>
      <el-button type="primary" @click="store.increment" class="mb-4">Count is {{ count }}</el-button>
      <p class="text-white/90 mb-4">
        Edit
        <code class="bg-black/20 px-2 py-1 rounded">components/HelloWorld.vue</code> to test HMR
      </p>
      <el-button type="success" size="large" @click="goToFlow" class="mt-4"> 打开流程图编辑器 </el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-container {
  display: flex;
  place-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}
</style>

<style scoped lang="less">
.read-the-docs {
  color: #888;
}
</style>
