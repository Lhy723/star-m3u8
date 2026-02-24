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
</style>
