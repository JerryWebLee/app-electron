import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/HelloWorld.vue'),
  },
  {
    path: '/flow',
    name: 'Flow',
    component: () => import('../components/LogicFlowView.vue'),
  },
  {
    path: '/mindmap',
    name: 'MindMap',
    component: () => import('../components/MindMapView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
