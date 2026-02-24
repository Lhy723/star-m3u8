<template>
  <div class="settings-view">
    <div class="card">
      <h2 class="card-title">设置</h2>
      <div class="form-group">
        <label>默认下载路径</label>
        <input type="text" placeholder="选择默认下载路径..." />
      </div>
      <div class="form-group">
        <label>主题</label>
        <select class="form-select">
          <option>浅色</option>
          <option>深色</option>
          <option>自动</option>
        </select>
      </div>
      <button class="btn-primary">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.settings-view {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.form-group input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-primary {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: var(--radius-md);
  background-color: #3b82f6;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
}
</style>
