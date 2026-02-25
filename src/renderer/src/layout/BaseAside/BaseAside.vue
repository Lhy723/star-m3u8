<template>
  <div class="base-aside">
    <div class="app-logo">
      <img src="@renderer/assets/logo.png" alt="Logo" class="logo-image" />
      <span class="logo-text">Star M3U8</span>
    </div>
    <nav class="nav-menu">
      <div class="nav-indicator" :style="indicatorStyle"></div>
      <router-link
        v-for="(item, index) in menuItems"
        :key="item.path"
        :ref="(el) => setNavItemRef(el, index)"
        :to="item.path"
        class="nav-item"
        :class="{ active: currentPath === item.path }"
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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  DownloadIcon,
  HistoryIcon,
  SettingsIcon,
  InfoIcon,
  MoonIcon,
  SunIcon
} from '@renderer/components/icons'

const route = useRoute()
const isDark = ref(false)
const navItemRefs = ref<Record<number, HTMLElement | null>>({})

const menuItems = [
  { path: '/', icon: DownloadIcon, label: '下载' },
  { path: '/history', icon: HistoryIcon, label: '历史' },
  { path: '/settings', icon: SettingsIcon, label: '设置' },
  { path: '/about', icon: InfoIcon, label: '关于' }
]

const currentPath = computed(() => route.path)
const themeTitle = computed(() => (isDark.value ? '切换到浅色模式' : '切换到深色模式'))

const indicatorStyle = reactive({
  top: '0px',
  height: '44px'
})

function setNavItemRef(el: unknown, index: number): void {
  if (el) {
    // router-link 返回组件实例，需要通过 $el 获取 DOM 元素
    const element = (el as { $el?: HTMLElement }).$el ?? el
    navItemRefs.value[index] = element as HTMLElement
  }
}

function updateIndicator(): void {
  const activeIndex = menuItems.findIndex((item) => item.path === currentPath.value)
  const activeEl = navItemRefs.value[activeIndex]
  if (activeIndex !== -1 && activeEl) {
    indicatorStyle.top = `${activeEl.offsetTop}px`
    indicatorStyle.height = `${activeEl.offsetHeight}px`
  }
}

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    updateIndicator()
  }
)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }

  setTimeout(() => {
    updateIndicator()
  }, 50)
})
</script>

<style scoped>
@import './BaseAside.css';
</style>
