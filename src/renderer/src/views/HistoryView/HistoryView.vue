<template>
  <div class="history-view">
    <div class="card">
      <h2 class="card-title">
        <HistoryIcon class="title-icon" />
        下载历史
      </h2>
      <div v-if="downloadStore.history.length === 0" class="empty-state">
        <FileCheckIcon class="empty-icon" />
        <p>暂无历史记录</p>
        <span>完成的下载任务将显示在这里</span>
      </div>
      <div v-else class="history-list">
        <div v-for="item in downloadStore.history" :key="item.id" class="history-item">
          <div class="history-icon">
            <CheckCircleIcon class="icon" />
          </div>
          <div class="history-info">
            <span class="history-filename">{{ item.filename }}</span>
            <span class="history-path">{{ item.savePath }}</span>
          </div>
          <div class="history-actions">
            <button class="action-btn play" title="打开文件" @click="openFile(item)">
              <PlayIcon class="action-icon" />
            </button>
            <button class="action-btn" title="打开文件夹" @click="openFolder(item)">
              <FolderIcon class="action-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDownloadStore } from '../../stores/download'
import type { DownloadItem } from '../../stores/download'
import {
  HistoryIcon,
  FileCheckIcon,
  CheckCircleIcon,
  FolderIcon,
  PlayIcon
} from '@renderer/components/icons'

const downloadStore = useDownloadStore()

function getFilePath(item: DownloadItem): string {
  const filename = item.filename.endsWith('.mp4') ? item.filename : `${item.filename}.mp4`
  return `${item.savePath}\\${filename}`
}

function openFile(item: DownloadItem): void {
  const filePath = getFilePath(item)
  downloadStore.openFile(filePath)
}

function openFolder(item: DownloadItem): void {
  downloadStore.openFolder(item.savePath)
}
</script>

<style scoped>
@import './HistoryView.css';
</style>
