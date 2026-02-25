<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="title-bar-title">{{ pageTitle }}</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" title="最小化" @click="minimize">
        <MinimizeIcon class="control-icon" />
      </button>
      <button
        class="control-btn maximize"
        :title="windowStore.isMaximized ? '还原' : '最大化'"
        @click="maximize"
      >
        <component
          :is="windowStore.isMaximized ? Maximize2Icon : MaximizeIcon"
          class="control-icon"
        />
      </button>
      <button class="control-btn close" title="关闭" @click="close">
        <CloseIcon class="control-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useWindowStore } from '@renderer/stores/window'
import { MinimizeIcon, MaximizeIcon, Maximize2Icon, CloseIcon } from '@renderer/components/icons'

const route = useRoute()
const windowStore = useWindowStore()

const pageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/': '下载',
    '/history': '历史',
    '/settings': '设置',
    '/about': '关于'
  }
  return titleMap[route.path] || 'Star M3U8'
})

function minimize(): void {
  windowStore.minimize()
}
function maximize(): void {
  windowStore.toggleMaximize()
}
function close(): void {
  windowStore.close()
}
</script>

<style scoped>
@import './TitleBar.css';
</style>
