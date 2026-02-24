<template>
  <div class="download-view">
    <div class="card add-card">
      <h2 class="card-title">
        <DownloadIcon class="title-icon" />
        添加下载
      </h2>
      <div class="form-group">
        <label for="url">M3U8 链接</label>
        <input
          id="url"
          v-model="url"
          type="text"
          placeholder="输入 M3U8 链接..."
          class="form-input"
        />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="filename">文件名</label>
          <input
            id="filename"
            v-model="filename"
            type="text"
            placeholder="video.mp4"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="path">下载路径</label>
          <div class="path-input">
            <input
              id="path"
              v-model="downloadStore.defaultPath"
              type="text"
              placeholder="选择下载路径..."
              readonly
              class="form-input"
            />
            <button class="btn-browse" @click="selectPath">
              <FolderIcon class="btn-icon" />
              浏览
            </button>
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="addDownload" :disabled="!url || !downloadStore.defaultPath">
        <ZapIcon class="btn-icon" />
        添加到队列
      </button>
    </div>

    <div class="card queue-card">
      <h2 class="card-title">
        <LayoutPanelTopIcon class="title-icon" />
        下载队列
        <span v-if="downloadStore.queue.length > 0" class="queue-count">
          {{ downloadStore.queue.length }}
        </span>
      </h2>
      <div v-if="downloadStore.queue.length === 0" class="empty-state">
        <FileIcon class="empty-icon" />
        <p>暂无下载任务</p>
        <span>添加 M3U8 链接开始下载</span>
      </div>
      <div v-else class="download-list">
        <DownloadCard v-for="item in downloadStore.queue" :key="item.id" :item="item" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDownloadStore } from '../../stores/download'
import DownloadCard from '../../components/DownloadCard/DownloadCard.vue'
import {
  DownloadIcon,
  FolderIcon,
  ZapIcon,
  LayoutPanelTopIcon,
  FileIcon
} from '@renderer/components/icons'

const downloadStore = useDownloadStore()
const url = ref('')
const filename = ref('video.mp4')

async function selectPath(): Promise<void> {
  await downloadStore.selectDirectory()
}

function addDownload(): void {
  if (!url.value || !downloadStore.defaultPath) return

  const item = {
    id: Date.now().toString(),
    url: url.value,
    filename: filename.value,
    savePath: downloadStore.defaultPath,
    progress: 0,
    speed: '0 KB/s',
    status: 'pending' as const
  }

  downloadStore.addToQueue(item)

  url.value = ''
  filename.value = 'video.mp4'
}
</script>

<style scoped>
@import './DownloadView.css';
</style>
