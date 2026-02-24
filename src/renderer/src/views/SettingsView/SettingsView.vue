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
          <label for="theme">主题</label>
          <div class="select-wrapper">
            <select id="theme" class="form-select">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="auto">跟随系统</option>
            </select>
            <ChevronDownIcon class="select-icon" />
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="section-title">下载设置</h3>
        
        <div class="form-group">
          <label for="concurrent">并发连接数</label>
          <div class="select-wrapper">
            <select id="concurrent" class="form-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4" selected>4</option>
              <option value="8">8</option>
              <option value="16">16</option>
            </select>
            <ChevronDownIcon class="select-icon" />
          </div>
        </div>
        
        <div class="form-group">
          <label for="retry">重试次数</label>
          <div class="select-wrapper">
            <select id="retry" class="form-select">
              <option value="0">不重试</option>
              <option value="3" selected>3 次</option>
              <option value="5">5 次</option>
              <option value="10">10 次</option>
            </select>
            <ChevronDownIcon class="select-icon" />
          </div>
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
import {
  SettingsIcon,
  FolderIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@renderer/components/icons'
</script>

<style scoped>
@import './SettingsView.css';
</style>
