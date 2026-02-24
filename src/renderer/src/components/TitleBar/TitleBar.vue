<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="title-bar-title">Star M3U8</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn minimize" @click="minimize" title="最小化">
        <MinimizeIcon class="control-icon" />
      </button>
      <button class="control-btn maximize" @click="maximize" :title="windowStore.isMaximized ? '还原' : '最大化'">
        <component :is="windowStore.isMaximized ? Maximize2Icon : MaximizeIcon" class="control-icon" />
      </button>
      <button class="control-btn close" @click="close" title="关闭">
        <CloseIcon class="control-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowStore } from '@renderer/stores/window'
import { MinimizeIcon, MaximizeIcon, Maximize2Icon, CloseIcon } from '@renderer/components/icons'

const windowStore = useWindowStore()

const minimize = () => windowStore.minimize()
const maximize = () => windowStore.toggleMaximize()
const close = () => windowStore.close()
</script>

<style scoped>
@import './TitleBar.css';
</style>
