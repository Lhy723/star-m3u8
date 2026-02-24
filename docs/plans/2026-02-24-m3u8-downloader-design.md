# M3U8 下载器设计文档

**日期：** 2026-02-24
**项目：** star-m3u8

---

## 一、项目概述

### 1.1 项目目标
制作一个美观、易用的跨平台 M3U8 视频下载器。

### 1.2 核心功能
- M3U8 视频下载与合并为 MP4
- 批量下载功能
- 下载队列管理（暂停/继续/进度显示）
- 自定义下载路径
- 历史记录管理
- 主题切换（深色/浅色/自动）

---

## 二、技术栈

| 类别 | 技术选型 |
|------|----------|
| 桌面框架 | Electron |
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite + electron-vite |
| UI 组件库 | Element Plus（自定义样式） |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| M3U8 下载 | m3u8-downloader |
| 视频合并 | fluent-ffmpeg + @ffmpeg-installer/ffmpeg |

---

## 三、UI 设计

### 3.1 布局结构
- **无边框窗口**：自定义标题栏（拖拽区 + 窗口控制按钮）
- **左右布局**：左侧导航栏 + 右侧主内容区
- **极简风格**：大量留白、柔和阴影、圆角卡片、流畅动画

### 3.2 页面结构
```
┌─────────────────────────────────────────────────────────┐
│  [拖拽区域]    Star M3U8    [─][□][✕]                  │ ← 自定义标题栏
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  🌐 下载     │              主内容区                      │
│              │                                          │
│  📜 历史     │                                          │
│              │                                          │
│  ⚙️ 设置     │                                          │
│              │                                          │
│  ℹ️ 关于     │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## 四、文件结构

```
src/
├── main/
│   ├── index.ts              # Electron 主进程
│   ├── downloader.ts         # M3U8 下载逻辑
│   └── ipc-handlers.ts       # IPC 通信处理
├── preload/
│   └── index.ts              # 预加载脚本
└── renderer/
    └── src/
        ├── components/
        │   ├── TitleBar/
        │   │   ├── TitleBar.vue
        │   │   └── TitleBar.css
        │   └── DownloadCard/
        │       ├── DownloadCard.vue
        │       └── DownloadCard.css
        ├── layout/
        │   ├── BaseAside/
        │   │   ├── BaseAside.vue
        │   │   └── BaseAside.css
        │   └── BaseHeader/
        │       ├── BaseHeader.vue
        │       └── BaseHeader.css
        ├── views/
        │   ├── DownloadView/
        │   │   ├── DownloadView.vue
        │   │   └── DownloadView.css
        │   ├── HistoryView/
        │   │   ├── HistoryView.vue
        │   │   └── HistoryView.css
        │   ├── SettingsView/
        │   │   ├── SettingsView.vue
        │   │   └── SettingsView.css
        │   └── AboutView/
        │       ├── AboutView.vue
        │       └── AboutView.css
        ├── stores/
        │   └── download.ts   # 下载状态管理
        ├── router/
        │   └── index.ts
        ├── styles/
        │   ├── variables.css # CSS 变量（主题）
        │   └── main.css      # 全局样式
        └── App.vue
```

---

## 五、功能模块说明

### 5.1 下载页面
- M3U8 链接输入框
- 下载路径选择器
- 文件名设置
- 下载队列展示（进度条、速度、状态）
- 批量添加链接
- 暂停/继续/取消操作

### 5.2 历史记录页面
- 已完成下载列表
- 文件信息展示
- 打开文件/打开文件夹
- 删除历史记录

### 5.3 设置页面
- 默认下载路径
- 并发下载数量
- 代理设置（可选）
- 主题切换（深色/浅色/自动）
- 通知设置

### 5.4 关于页面
- 应用版本
- 作者信息
- 开源许可证

---

## 六、实现要点

### 6.1 Electron 配置
- 无边框窗口：`frame: false`
- 自定义标题栏拖拽区域：`-webkit-app-region: drag`
- 窗口控制按钮：最小化、最大化/还原、关闭

### 6.2 主题系统
- 使用 CSS 变量定义颜色
- 支持深色/浅色/自动三种模式
- 主题切换通过修改 `data-theme` 属性实现

### 6.3 IPC 通信
- 主进程处理下载逻辑
- 渲染进程负责 UI 展示
- 通过 IPC 通道传递下载进度、状态等信息
