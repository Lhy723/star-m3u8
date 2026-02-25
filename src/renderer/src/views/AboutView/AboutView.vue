<template>
  <div class="about-view">
    <div class="card">
      <h2 class="card-title">
        <InfoIcon class="title-icon" />
        关于
      </h2>
      <div class="about-content">
        <div class="about-logo">
          <img src="@renderer/assets/logo.png" alt="Logo" class="logo-image" />
        </div>
        <p class="about-name">Star M3U8</p>
        <p class="about-version">版本 1.0.0</p>
        <p class="about-desc">一个美观、易用的跨平台 M3U8 视频下载器</p>
        <div class="about-links">
          <button class="about-link" @click="openAuthorPage">
            <UserIcon class="link-icon" />
            作者主页
          </button>
          <button class="about-link" @click="openIssuePage">
            <AlertTriangleIcon class="link-icon" />
            问题反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoIcon, UserIcon, AlertTriangleIcon } from '@renderer/components/icons'

const openAuthorPage = (): void => {
  window.electron?.openExternal('https://github.com/Lhy723')
}

const openIssuePage = (): void => {
  window.electron?.openExternal('https://github.com/Lhy723/star-m3u8/issues')
}
</script>

<style scoped>
@import './AboutView.css';
</style>
