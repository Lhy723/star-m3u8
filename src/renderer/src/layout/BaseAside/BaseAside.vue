<template>
  <div class="base-aside">
    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        active-class="active"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menuItems = ref([
  { path: '/', icon: '🌐', label: '下载' },
  { path: '/history', icon: '📜', label: '历史' },
  { path: '/settings', icon: '⚙️', label: '设置' },
  { path: '/about', icon: 'ℹ️', label: '关于' }
])
</script>

<style scoped>
@import './BaseAside.css';
</style>
