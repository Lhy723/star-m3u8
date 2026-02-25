<template>
  <div class="app">
    <div class="app-layout">
      <!-- 左侧导航栏区域 -->
      <div class="aside-wrapper">
        <!-- 装饰色块 - 凸显磨砂玻璃质感 -->
        <div class="decorative-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
        </div>
        <!-- 左侧悬浮导航栏 -->
        <BaseAside />
      </div>
      
      <!-- 右侧内容区域 -->
      <div class="app-right">
        <!-- 顶部标题栏 -->
        <TitleBar />
        
        <!-- 主内容区 -->
        <main class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TitleBar from './components/TitleBar/TitleBar.vue'
import BaseAside from './layout/BaseAside/BaseAside.vue'
import { useWindowStore } from '@renderer/stores/window'
import { useDownloadStore } from '@renderer/stores/download'

const windowStore = useWindowStore()
const downloadStore = useDownloadStore()

onMounted(() => {
  windowStore.init()
  downloadStore.init()
})

onUnmounted(() => {
  windowStore.dispose()
  downloadStore.dispose()
})
</script>

<style>
.app {
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 8px;
  gap: 8px;
}

.aside-wrapper {
  position: relative;
  width: 240px;
  height: 100%;
}

/* 装饰色块 */
.decorative-blobs {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.6;
}

.blob-1 {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  top: 10%;
  left: -20px;
}

.blob-2 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  bottom: 30%;
  right: -10px;
}

.blob-3 {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  bottom: 10%;
  left: 20px;
}

/* 深色模式色块 */
[data-theme='dark'] .blob {
  opacity: 0.3;
}

.app-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.25s ease,
    filter 0.25s ease,
    transform 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  filter: blur(8px);
  transform: scale(0.98);
}

.page-fade-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: scale(1.02);
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .page-fade-enter-from,
  .page-fade-leave-to {
    filter: none;
    transform: none;
  }
}

/* 深色模式 */
[data-theme='dark'] .app {
  background: #000000;
}
</style>
