<template>
  <div class="download-view">
    <div class="card add-card">
      <h2 class="card-title">添加下载</h2>
      <div class="form-group">
        <label>M3U8 链接</label>
        <input v-model="url" type="text" placeholder="输入 M3U8 链接..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>文件名</label>
          <input v-model="filename" type="text" placeholder="video.mp4" />
        </div>
        <div class="form-group">
          <label>下载路径</label>
          <div class="path-input">
            <input v-model="downloadPath" type="text" placeholder="选择下载路径..." readonly />
            <button @click="selectPath">浏览</button>
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="addDownload" :disabled="!url || !downloadPath">
        添加到队列
      </button>
    </div>

    <div class="card queue-card">
      <h2 class="card-title">下载队列</h2>
      <div v-if="downloadStore.queue.length === 0" class="empty-state">
        暂无下载任务
      </div>
      <div v-else class="download-list">
        <DownloadCard
          v-for="item in downloadStore.queue"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDownloadStore } from '../../stores/download'
import DownloadCard from '../../components/DownloadCard/DownloadCard.vue'

const downloadStore = useDownloadStore()
const url = ref('')
const filename = ref('video.mp4')
const downloadPath = ref('')

const selectPath = async () => {
  const path = await window.electron?.ipcRenderer.invoke('select-directory')
  if (path) {
    downloadPath.value = path
  }
}

const addDownload = () => {
  if (!url.value || !downloadPath.value) return

  const item = {
    id: Date.now().toString(),
    url: url.value,
    filename: filename.value,
    path: downloadPath.value,
    progress: 0,
    speed: '0 KB/s',
    status: 'pending' as const
  }

  downloadStore.addToQueue(item)
  window.electron?.ipcRenderer.send('start-download', item)

  url.value = ''
  filename.value = 'video.mp4'
}
</script>

<style scoped>
@import './DownloadView.css';
</style>
