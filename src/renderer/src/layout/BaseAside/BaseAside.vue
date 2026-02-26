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
import { useSettingsStore } from '@renderer/stores/settings'
import {
  DownloadIcon,
  HistoryIcon,
  SettingsIcon,
  InfoIcon,
  MoonIcon,
  SunIcon
} from '@renderer/components/icons'

const route = useRoute()
const settingsStore = useSettingsStore()
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

function applyTheme(dark: boolean): void {
  isDark.value = dark
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

function toggleTheme(): void {
  const newDark = !isDark.value
  applyTheme(newDark)
  // 同步更新 settingsStore
  settingsStore.theme = newDark ? 'dark' : 'light'
  settingsStore.saveSettings()
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    updateIndicator()
  }
)

// 监听设置页面主题变化，同步更新界面
watch(
  () => settingsStore.theme,
  (theme) => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (theme === 'dark' || (theme === 'auto' && prefersDark)) {
      applyTheme(true)
    } else {
      applyTheme(false)
    }
  }
)

onMounted(async () => {
  // 先加载设置
  await settingsStore.loadSettings()

  // 根据设置中的主题值应用主题
  const theme = settingsStore.theme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (theme === 'dark' || (theme === 'auto' && prefersDark)) {
    applyTheme(true)
  } else {
    applyTheme(false)
  }

  setTimeout(() => {
    updateIndicator()
  }, 50)
})
</script>

<style scoped>
@import './BaseAside.css';
</style>
