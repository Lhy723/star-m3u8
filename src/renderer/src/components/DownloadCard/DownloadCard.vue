<template>
  <div class="download-card" :class="{ 'is-downloading': item.status === 'downloading' }">
    <div class="download-icon">
      <component :is="statusIcon" class="icon" :class="item.status" />
    </div>
    <div class="download-info">
      <div class="download-header">
        <span class="download-filename">{{ item.filename }}</span>
        <span :class="['status-badge', item.status]" :title="item.status === 'error' ? item.errorMessage : ''">
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
      <p v-if="item.status === 'error' && item.errorMessage" class="error-message">
        {{ item.errorMessage }}
      </p>
    </div>
    <div class="download-actions">
      <button
        v-if="item.status === 'downloading'"
        class="action-btn pause"
        title="Pause"
        @click="pause"
      >
        <PauseIcon class="action-icon" />
      </button>
      <button
        v-else-if="item.status === 'paused'"
        class="action-btn resume"
        title="Resume"
        @click="resume"
      >
        <PlayIcon class="action-icon" />
      </button>
      <button class="action-btn cancel" title="Cancel" @click="cancel">
        <CancelIcon class="action-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DownloadItem } from '../../stores/download'
import { useDownloadStore } from '../../stores/download'
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
const downloadStore = useDownloadStore()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: 'Pending',
    downloading: 'Downloading',
    paused: 'Paused',
    merging: 'Merging',
    completed: 'Completed',
    error: 'Error'
  }
  return map[props.item.status] || props.item.status
})

const statusIcon = computed(() => {
  const map: Record<string, unknown> = {
    pending: FileIcon,
    downloading: ZapIcon,
    paused: FileIcon,
    merging: ZapIcon,
    completed: CheckCircleIcon,
    error: AlertTriangleIcon
  }
  return map[props.item.status] || FileIcon
})

const statusBadgeIcon = computed(() => {
  if (props.item.status === 'downloading' || props.item.status === 'merging') return ZapIcon
  if (props.item.status === 'completed') return CheckCircleIcon
  if (props.item.status === 'error') return AlertTriangleIcon
  return null
})

function pause(): void {
  downloadStore.pauseDownload(props.item.id)
}

function resume(): void {
  downloadStore.resumeDownload(props.item.id)
}

function cancel(): void {
  downloadStore.cancelDownload(props.item.id)
}
</script>

<style scoped>
@import './DownloadCard.css';
</style>
