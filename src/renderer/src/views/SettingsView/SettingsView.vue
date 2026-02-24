<template>
  <div class="settings-view">
    <div class="card">
      <h2 class="card-title">
        <SettingsIcon class="title-icon" />
        设置
      </h2>

      <div class="settings-section">
        <h3 class="section-title">常规设置</h3>

        <div class="form-group">
          <label for="download-path">默认下载路径</label>
          <div class="path-input">
            <input
              id="download-path"
              type="text"
              placeholder="选择默认下载路径..."
              class="form-input"
              readonly
            />
            <button class="btn-browse">
              <FolderIcon class="btn-icon" />
              浏览
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>主题</label>
          <CustomSelect v-model="theme" :options="themeOptions" />
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">下载设置</h3>

        <div class="form-group">
          <label>并发连接数</label>
          <CustomSelect v-model="concurrent" :options="concurrentOptions" />
        </div>

        <div class="form-group">
          <label>重试次数</label>
          <CustomSelect v-model="retry" :options="retryOptions" />
        </div>
      </div>

      <button class="btn-primary">
        <CheckCircleIcon class="btn-icon" />
        保存设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SettingsIcon, FolderIcon, CheckCircleIcon } from '@renderer/components/icons'
import CustomSelect from '@renderer/components/CustomSelect/CustomSelect.vue'

const theme = ref('auto')
const concurrent = ref('4')
const retry = ref('3')

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' }
]

const concurrentOptions = [
  { value: '1', label: '1 个连接' },
  { value: '2', label: '2 个连接' },
  { value: '4', label: '4 个连接' },
  { value: '8', label: '8 个连接' },
  { value: '16', label: '16 个连接' }
]

const retryOptions = [
  { value: '0', label: '不重试' },
  { value: '3', label: '重试 3 次' },
  { value: '5', label: '重试 5 次' },
  { value: '10', label: '重试 10 次' }
]
</script>

<style scoped>
@import './SettingsView.css';
</style>
