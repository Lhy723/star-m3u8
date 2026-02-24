<template>
  <div class="about-view">
    <div class="card">
      <h2 class="card-title">
        <InfoIcon class="title-icon" />
        关于
      </h2>
      <div class="about-content">
        <div class="about-logo">
          <div class="logo-icon">
            <ZapIcon class="icon" />
          </div>
        </div>
        <p class="about-name">Star M3U8</p>
        <p class="about-version">版本 1.0.0</p>
        <p class="about-desc">一个美观、易用的跨平台 M3U8 视频下载器</p>
        <div class="about-links">
          <a href="#" class="about-link">
            <UserIcon class="link-icon" />
            作者主页
          </a>
          <a href="#" class="about-link">
            <AlertTriangleIcon class="link-icon" />
            问题反馈
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoIcon, ZapIcon, UserIcon, AlertTriangleIcon } from '@renderer/components/icons'
</script>

<style scoped>
@import './AboutView.css';
</style>
