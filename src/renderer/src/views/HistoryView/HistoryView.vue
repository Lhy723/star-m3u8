<template>
  <div class="history-view">
    <div class="card">
      <h2 class="card-title">下载历史</h2>
      <div v-if="downloadStore.history.length === 0" class="empty-state">
        暂无历史记录
      </div>
      <div v-else class="history-list">
        <div v-for="item in downloadStore.history" :key="item.id" class="history-item">
          <div class="history-info">
            <span class="history-filename">{{ item.filename }}</span>
            <span class="history-path">{{ item.path }}</span>
          </div>
          <div class="history-actions">
            <button class="action-btn">打开文件夹</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDownloadStore } from '../../stores/download'

const downloadStore = useDownloadStore()
</script>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
}

.card {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.history-info {
  flex: 1;
}

.history-filename {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.history-path {
  font-size: 12px;
  color: var(--text-secondary);
}

.action-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--bg-secondary);
}
</style>
