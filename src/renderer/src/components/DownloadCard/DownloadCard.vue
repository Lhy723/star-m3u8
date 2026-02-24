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
  window.electron?.ipcRenderer.send('pause-download', props.item.id)
}

const resume = () => {
  window.electron?.ipcRenderer.send('resume-download', props.item.id)
}

const cancel = () => {
  window.electron?.ipcRenderer.send('cancel-download', props.item.id)
}
</script>

<style scoped>
@import './DownloadCard.css';
</style>
