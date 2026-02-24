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
import { useWindowStore } from '@renderer/stores/window'

const windowStore = useWindowStore()

const minimize = () => windowStore.minimize()
const maximize = () => windowStore.toggleMaximize()
const close = () => windowStore.close()
</script>

<style scoped>
@import './TitleBar.css';
</style>
