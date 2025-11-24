<script setup lang="ts">
import { useMainStore } from '../store'
import { storeToRefs } from 'pinia'

const store = useMainStore()
const { count } = storeToRefs(store)
</script>

<template>
  <div class="card">
    <h1>Electron + Vue 3 + Element Plus</h1>
    <el-button type="primary" @click="store.increment">Count is {{ count }}</el-button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
