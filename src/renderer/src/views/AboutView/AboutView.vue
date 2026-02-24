<template>
  <div class="about-view">
    <div class="card">
      <h2 class="card-title">关于</h2>
      <div class="about-content">
        <p class="about-name">Star M3U8</p>
        <p class="about-version">版本 1.0.0</p>
        <p class="about-desc">一个美观、易用的跨平台 M3U8 视频下载器</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-view {
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

.about-content {
  text-align: center;
  padding: 32px 0;
}

.about-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.about-version {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.about-desc {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
