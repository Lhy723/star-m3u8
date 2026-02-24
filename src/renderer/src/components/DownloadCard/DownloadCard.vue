<template>
  <div class="download-card" :class="{ 'is-downloading': item.status === 'downloading' }">
    <div class="download-icon">
      <component :is="statusIcon" class="icon" :class="item.status" />
    </div>
    <div class="download-info">
      <div class="download-header">
        <span class="download-filename">{{ item.filename }}</span>
        <span :class="['status-badge', item.status]">
          <component :is="statusBadgeIcon" class="badge-icon" />
          {{ statusText }}
        </span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: item.progress + '%' }"
            :class="item.status"
          ></div>
        </div>
        <span class="progress-text">
          <span class="progress-percent">{{ item.progress }}%</span>
          <span class="progress-speed">{{ item.speed }}</span>
        </span>
      </div>
    </div>
    <div class="download-actions">
      <button
        v-if="item.status === 'downloading'"
        @click="pause"
        class="action-btn pause"
        title="暂停"
      >
        <PauseIcon class="action-icon" />
      </button>
      <button
        v-else-if="item.status === 'paused'"
        @click="resume"
        class="action-btn resume"
        title="继续"
      >
        <PlayIcon class="action-icon" />
      </button>
      <button @click="cancel" class="action-btn cancel" title="取消">
        <CancelIcon class="action-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DownloadItem } from '../../stores/download'
import {
  PauseIcon,
  PlayIcon,
  CancelIcon,
  ZapIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  FileIcon
} from '@renderer/components/icons'

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

const statusIcon = computed(() => {
  const map: Record<string, unknown> = {
    pending: FileIcon,
    downloading: ZapIcon,
    paused: FileIcon,
    completed: CheckCircleIcon,
    error: AlertTriangleIcon
  }
  return map[props.item.status] || FileIcon
})

const statusBadgeIcon = computed(() => {
  if (props.item.status === 'downloading') return ZapIcon
  if (props.item.status === 'completed') return CheckCircleIcon
  if (props.item.status === 'error') return AlertTriangleIcon
  return null
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
