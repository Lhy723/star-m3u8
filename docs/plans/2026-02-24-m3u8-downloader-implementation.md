# M3U8 下载器实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个美观、易用的跨平台 M3U8 视频下载器。

**架构：** Electron + Vue 3 应用，主进程处理下载逻辑，渲染进程负责 UI 展示，通过 IPC 通信。

**技术栈：** Electron, Vue 3, TypeScript, Vite, Element Plus, Pinia, Vue Router, m3u8-downloader, fluent-ffmpeg

---

## 阶段一：项目基础设施

### Task 1: 安装项目依赖

**文件：**
- 修改：`package.json`

**Step 1: 安装所需依赖**
```bash
pnpm add pinia vue-router element-plus @element-plus/icons-vue axios
pnpm add -D @types/node
```

**Step 2: 验证依赖安装**
运行：`pnpm list`
预期：依赖已正确安装

---

### Task 2: 配置 Electron 无边框窗口

**文件：**
- 修改：`src/main/index.ts`

**Step 1: 修改窗口配置**
```typescript
// 在 createWindow 函数中
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  frame: false, // 无边框
  titleBarStyle: 'hidden',
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    sandbox: false
  }
})
```

**Step 2: 添加窗口控制 IPC 处理器**
```typescript
import { ipcMain } from 'electron'

ipcMain.handle('window-minimize', () => mainWindow?.minimize())
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window-close', () => mainWindow?.close())
```

---

### Task 3: 设置主题系统与全局样式

**文件：**
- 创建：`src/renderer/src/styles/variables.css`
- 创建：`src/renderer/src/styles/main.css`
- 修改：`src/renderer/src/main.ts`

**Step 1: 创建 CSS 变量文件**
```css
/* variables.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}
```

**Step 2: 创建全局样式文件**
```css
/* main.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}
```

**Step 3: 在 main.ts 中引入样式**
```typescript
import './styles/variables.css'
import './styles/main.css'
```

---

## 阶段二：布局组件

### Task 4: 创建自定义标题栏组件

**文件：**
- 创建：`src/renderer/src/components/TitleBar/TitleBar.vue`
- 创建：`src/renderer/src/components/TitleBar/TitleBar.css`

**Step 1: 创建 TitleBar.vue**
```vue
<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="title-bar-title">Star M3U8</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" @click="minimize">─</button>
      <button class="control-btn maximize" @click="maximize">□</button>
      <button class="control-btn close" @click="close">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const minimize = () => window.electron.ipcRenderer.invoke('window-minimize')
const maximize = () => window.electron.ipcRenderer.invoke('window-maximize')
const close = () => window.electron.ipcRenderer.invoke('window-close')
</script>

<style scoped>
@import './TitleBar.css';
</style>
```

**Step 2: 创建 TitleBar.css**
```css
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.title-bar-drag {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 16px;
  -webkit-app-region: drag;
}

.title-bar-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.title-bar-controls {
  display: flex;
  gap: 4px;
  padding-right: 8px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 40px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.control-btn:hover {
  background-color: var(--bg-card);
}

.control-btn.close:hover {
  background-color: #ef4444;
  color: white;
}
```

---

### Task 5: 创建左侧导航栏组件

**文件：**
- 创建：`src/renderer/src/layout/BaseAside/BaseAside.vue`
- 创建：`src/renderer/src/layout/BaseAside/BaseAside.css`

**Step 1: 创建 BaseAside.vue**
```vue
<template>
  <div class="base-aside">
    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuItems = ref([
  { path: '/', icon: '🌐', label: '下载' },
  { path: '/history', icon: '📜', label: '历史' },
  { path: '/settings', icon: '⚙️', label: '设置' },
  { path: '/about', icon: 'ℹ️', label: '关于' }
])
</script>

<style scoped>
@import './BaseAside.css';
</style>
```

**Step 2: 创建 BaseAside.css**
```css
.base-aside {
  width: 200px;
  height: 100%;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 24px 16px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--bg-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.nav-icon {
  font-size: 20px;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}
```

---

## 阶段三：路由与状态管理

### Task 6: 配置 Vue Router

**文件：**
- 创建：`src/renderer/src/router/index.ts`
- 修改：`src/renderer/src/main.ts`

**Step 1: 创建路由配置**
```typescript
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
```

**Step 2: 在 main.ts 中引入路由**
```typescript
import router from './router'

app.use(router)
```

---

### Task 7: 配置 Pinia 状态管理

**文件：**
- 创建：`src/renderer/src/stores/download.ts`
- 修改：`src/renderer/src/main.ts`

**Step 1: 创建下载状态 store**
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DownloadItem {
  id: string
  url: string
  filename: string
  path: string
  progress: number
  speed: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
}

export const useDownloadStore = defineStore('download', () => {
  const queue = ref<DownloadItem[]>([])
  const history = ref<DownloadItem[]>([])

  const addToQueue = (item: DownloadItem) => {
    queue.value.push(item)
  }

  const updateProgress = (id: string, progress: number, speed: string) => {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      item.progress = progress
      item.speed = speed
    }
  }

  const updateStatus = (id: string, status: DownloadItem['status']) => {
    const item = queue.value.find(i => i.id === id)
    if (item) {
      item.status = status
      if (status === 'completed') {
        history.value.unshift({ ...item })
      }
    }
  }

  const removeFromQueue = (id: string) => {
    const index = queue.value.findIndex(i => i.id === id)
    if (index > -1) {
      queue.value.splice(index, 1)
    }
  }

  return {
    queue,
    history,
    addToQueue,
    updateProgress,
    updateStatus,
    removeFromQueue
  }
})
```

**Step 2: 在 main.ts 中引入 Pinia**
```typescript
import { createPinia } from 'pinia'

app.use(createPinia())
```

---

### Task 8: 更新 App.vue 主布局

**文件：**
- 修改：`src/renderer/src/App.vue`

**Step 1: 更新 App.vue**
```vue
<template>
  <div class="app">
    <TitleBar />
    <div class="app-content">
      <BaseAside />
      <main class="app-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from './components/TitleBar/TitleBar.vue'
import BaseAside from './layout/BaseAside/BaseAside.vue'
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}
</style>
```

---

### Task 9: 更新 preload 脚本

**文件：**
- 修改：`src/preload/index.ts`
- 修改：`src/preload/index.d.ts`

**Step 1: 更新 preload index.ts**
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (...args: any[]) => void) => {
      const subscription = (_event: any, ...args: any[]) => listener(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    }
  }
})
```

**Step 2: 更新类型定义**
```typescript
export interface ElectronAPI {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, listener: (...args: any[]) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
```

---

## 阶段四：页面视图

### Task 10: 创建下载页面

**文件：**
- 创建：`src/renderer/src/views/DownloadView/DownloadView.vue`
- 创建：`src/renderer/src/views/DownloadView/DownloadView.css`

**Step 1: 创建 DownloadView.vue**
```vue
<template>
  <div class="download-view">
    <div class="card add-card">
      <h2 class="card-title">添加下载</h2>
      <div class="form-group">
        <label>M3U8 链接</label>
        <input v-model="url" type="text" placeholder="输入 M3U8 链接..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>文件名</label>
          <input v-model="filename" type="text" placeholder="video.mp4" />
        </div>
        <div class="form-group">
          <label>下载路径</label>
          <div class="path-input">
            <input v-model="downloadPath" type="text" placeholder="选择下载路径..." readonly />
            <button @click="selectPath">浏览</button>
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="addDownload" :disabled="!url || !downloadPath">
        添加到队列
      </button>
    </div>

    <div class="card queue-card">
      <h2 class="card-title">下载队列</h2>
      <div v-if="downloadStore.queue.length === 0" class="empty-state">
        暂无下载任务
      </div>
      <div v-else class="download-list">
        <DownloadCard
          v-for="item in downloadStore.queue"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDownloadStore } from '../../stores/download'
import DownloadCard from '../../components/DownloadCard/DownloadCard.vue'

const downloadStore = useDownloadStore()
const url = ref('')
const filename = ref('video.mp4')
const downloadPath = ref('')

const selectPath = async () => {
  const path = await window.electron.ipcRenderer.invoke('select-directory')
  if (path) {
    downloadPath.value = path
  }
}

const addDownload = () => {
  if (!url.value || !downloadPath.value) return

  const item = {
    id: Date.now().toString(),
    url: url.value,
    filename: filename.value,
    path: downloadPath.value,
    progress: 0,
    speed: '0 KB/s',
    status: 'pending' as const
  }

  downloadStore.addToQueue(item)
  window.electron.ipcRenderer.send('start-download', item)

  url.value = ''
  filename.value = 'video.mp4'
}
</script>

<style scoped>
@import './DownloadView.css';
</style>
```

**Step 2: 创建 DownloadView.css**
```css
.download-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.path-input {
  display: flex;
  gap: 8px;
}

.path-input input {
  flex: 1;
}

.path-input button {
  padding: 12px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.path-input button:hover {
  background-color: var(--bg-primary);
}

.btn-primary {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-md);
  background-color: #3b82f6;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
  font-size: 14px;
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

---

### Task 11: 创建下载卡片组件

**文件：**
- 创建：`src/renderer/src/components/DownloadCard/DownloadCard.vue`
- 创建：`src/renderer/src/components/DownloadCard/DownloadCard.css`

**Step 1: 创建 DownloadCard.vue**
```vue
<template>
  <div class="download-card">
    <div class="download-info">
      <div class="download-header">
        <span class="download-filename">{{ item.filename }}</span>
        <span :class="['status-badge', item.status]">{{ statusText }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ item.progress }}% · {{ item.speed }}</span>
      </div>
    </div>
    <div class="download-actions">
      <button v-if="item.status === 'downloading'" @click="pause" class="action-btn">
        暂停
      </button>
      <button v-else-if="item.status === 'paused'" @click="resume" class="action-btn">
        继续
      </button>
      <button @click="cancel" class="action-btn danger">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DownloadItem } from '../../stores/download'

interface Props {
  item: DownloadItem
}

const props = defineProps<Props>()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '等待中',
    downloading: '下载中',
    paused: '已暂停',
    completed: '已完成',
    error: '出错'
  }
  return map[props.item.status] || props.item.status
})

const pause = () => {
  window.electron.ipcRenderer.send('pause-download', props.item.id)
}

const resume = () => {
  window.electron.ipcRenderer.send('resume-download', props.item.id)
}

const cancel = () => {
  window.electron.ipcRenderer.send('cancel-download', props.item.id)
}
</script>

<style scoped>
@import './DownloadCard.css';
</style>
```

**Step 2: 创建 DownloadCard.css**
```css
.download-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.download-info {
  flex: 1;
  margin-right: 24px;
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.download-filename {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.downloading {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-badge.paused {
  background-color: #f1f5f9;
  color: #64748b;
}

.status-badge.completed {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-badge.error {
  background-color: #fee2e2;
  color: #dc2626;
}

[data-theme="dark"] .status-badge.pending {
  background-color: #78350f;
  color: #fbbf24;
}

[data-theme="dark"] .status-badge.downloading {
  background-color: #1e3a8a;
  color: #60a5fa;
}

[data-theme="dark"] .status-badge.paused {
  background-color: #334155;
  color: #94a3b8;
}

[data-theme="dark"] .status-badge.completed {
  background-color: #14532d;
  color: #4ade80;
}

[data-theme="dark"] .status-badge.error {
  background-color: #7f1d1d;
  color: #f87171;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.download-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--bg-secondary);
}

.action-btn.danger:hover {
  background-color: #fee2e2;
  color: #dc2626;
  border-color: #dc2626;
}

[data-theme="dark"] .action-btn.danger:hover {
  background-color: #7f1d1d;
  color: #f87171;
  border-color: #f87171;
}
```

---

### Task 12: 创建其他页面（历史/设置/关于）

由于篇幅限制，这三个页面的创建将遵循相同的模式：
- 历史记录页面：展示已完成下载列表，提供打开文件/文件夹功能
- 设置页面：提供主题切换、下载路径设置等
- 关于页面：显示版本信息

---

## 阶段五：主进程下载逻辑

### Task 13: 创建下载器模块

**文件：**
- 创建：`src/main/downloader.ts`

**Step 1: 创建 downloader.ts**
```typescript
import { dialog } from 'electron'
import { join } from 'path'

export async function selectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
}

export class DownloadManager {
  private tasks = new Map<string, any>()

  async startDownload(item: any): Promise<void> {
    console.log('Starting download:', item)
  }

  pauseDownload(id: string): void {
    console.log('Pausing download:', id)
  }

  resumeDownload(id: string): void {
    console.log('Resuming download:', id)
  }

  cancelDownload(id: string): void {
    console.log('Canceling download:', id)
    this.tasks.delete(id)
  }
}
```

---

### Task 14: 添加 IPC 处理器

**文件：**
- 创建：`src/main/ipc-handlers.ts`
- 修改：`src/main/index.ts`

**Step 1: 创建 ipc-handlers.ts**
```typescript
import { ipcMain } from 'electron'
import { selectDirectory, DownloadManager } from './downloader'

const downloadManager = new DownloadManager()

export function registerIpcHandlers() {
  ipcMain.handle('select-directory', () => selectDirectory())

  ipcMain.on('start-download', (_event, item) => {
    downloadManager.startDownload(item)
  })

  ipcMain.on('pause-download', (_event, id) => {
    downloadManager.pauseDownload(id)
  })

  ipcMain.on('resume-download', (_event, id) => {
    downloadManager.resumeDownload(id)
  })

  ipcMain.on('cancel-download', (_event, id) => {
    downloadManager.cancelDownload(id)
  })
}
```

**Step 2: 在 main/index.ts 中注册 IPC**
```typescript
import { registerIpcHandlers } from './ipc-handlers'

// 在 createWindow 之前调用
registerIpcHandlers()
```

---

## 阶段六：集成与测试

### Task 15: 安装并配置 Element Plus

**文件：**
- 修改：`src/renderer/src/main.ts`

**Step 1: 引入 Element Plus**
```typescript
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

app.use(ElementPlus)
```

---

### Task 16: 运行项目并测试

**Step 1: 启动开发服务器**
```bash
pnpm dev
```

**Step 2: 验证功能**
- 窗口无边框且可拖拽
- 窗口控制按钮工作正常
- 导航栏可切换页面
- 主题系统生效
- 表单输入正常

---

## 后续任务（可选）

1. 集成 m3u8-downloader 和 ffmpeg
2. 实现真实的下载逻辑
3. 添加历史记录持久化
4. 完善设置页面功能
5. 添加更多自定义主题选项
