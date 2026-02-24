import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/DownloadView/DownloadView.vue') },
  { path: '/history', component: () => import('../views/HistoryView/HistoryView.vue') },
  { path: '/settings', component: () => import('../views/SettingsView/SettingsView.vue') },
  { path: '/about', component: () => import('../views/AboutView/AboutView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
