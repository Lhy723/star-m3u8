<template>
  <div class="app">
    <TitleBar />
    <div class="app-content">
      <BaseAside />
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TitleBar from './components/TitleBar/TitleBar.vue'
import BaseAside from './layout/BaseAside/BaseAside.vue'
import { useWindowStore } from '@renderer/stores/window'

const windowStore = useWindowStore()

onMounted(() => {
  windowStore.init()
})

onUnmounted(() => {
  windowStore.dispose()
})
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

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease;
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
</style>
