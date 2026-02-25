<template>
  <div class="base-aside">
    <div class="app-logo">
      <img src="@renderer/assets/logo.png" alt="Logo" class="logo-image" />
      <span class="logo-text">Star M3U8</span>
    </div>
    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
    <div class="aside-footer">
      <button class="theme-toggle" :title="themeTitle" @click="toggleTheme">
        <component :is="isDark ? SunIcon : MoonIcon" class="theme-icon" />
        <span class="theme-label">{{ isDark ? '浅色模式' : '深色模式' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DownloadIcon,
  HistoryIcon,
  SettingsIcon,
  InfoIcon,
  MoonIcon,
  SunIcon
} from '@renderer/components/icons'

const isDark = ref(false)

const menuItems = [
  { path: '/', icon: DownloadIcon, label: '下载' },
  { path: '/history', icon: HistoryIcon, label: '历史' },
  { path: '/settings', icon: SettingsIcon, label: '设置' },
  { path: '/about', icon: InfoIcon, label: '关于' }
]

const themeTitle = computed(() => (isDark.value ? '切换到浅色模式' : '切换到深色模式'))

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
</script>

<style scoped>
@import './BaseAside.css';
</style>
