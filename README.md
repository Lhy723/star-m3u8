<div align="center">

# ⭐ Star M3U8

<img src="docs/screenshots/logo.png" alt="Star M3U8 Logo" width="128" height="128">

**简洁高效的 M3U8 视频下载器**

[![Version](https://img.shields.io/github/v/release/Lhy723/star-m3u8?style=flat-square&logo=github&color=blue)](https://github.com/Lhy723/star-m3u8/releases)
[![License](https://img.shields.io/github/license/Lhy723/star-m3u8?style=flat-square&color=green)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square&logo=electron)](https://github.com/Lhy723/star-m3u8)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-39.x-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[下载最新版本](https://github.com/Lhy723/star-m3u8/releases) · [报告问题](https://github.com/Lhy723/star-m3u8/issues) · [功能建议](https://github.com/Lhy723/star-m3u8/issues/new)

</div>

---

## 📸 应用截图

### 主界面 - 亮色主题
> 📷 截图文件位置：`docs/screenshots/main-light.png`
>
> 建议内容：展示下载任务列表、进度条、操作按钮等核心功能界面

### 主界面 - 暗色主题
> 📷 截图文件位置：`docs/screenshots/main-dark.png`
>
> 建议内容：展示暗色主题下的主界面效果

### 设置页面
> 📷 截图文件位置：`docs/screenshots/settings.png`
>
> 建议内容：展示下载路径、并发数、主题切换等设置选项

### 下载历史
> 📷 截图文件位置：`docs/screenshots/history.png`
>
> 建议内容：展示已完成的下载历史记录列表

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🚀 **高效下载** | 支持 M3U8 视频链接解析与多线程下载 |
| 📦 **多任务管理** | 支持多任务并行下载，实时进度显示 |
| ⏯️ **任务控制** | 支持暂停、恢复、取消下载操作 |
| 🎨 **主题切换** | 内置亮色/暗色主题，一键切换 |
| 📁 **自动合并** | 下载完成后自动使用 FFmpeg 合并为 MP4 |
| 💾 **历史记录** | 保存下载历史，方便查看与管理 |
| 🖥️ **跨平台** | 支持 Windows、macOS、Linux 三大平台 |

---

## 📥 安装与使用

### 下载安装包

前往 [Releases](https://github.com/Lhy723/star-m3u8/releases) 页面下载对应平台的安装包：

| 平台 | 文件格式 |
|------|----------|
| Windows | `.exe` (安装包) / `.zip` (便携版) |
| macOS | `.dmg` |
| Linux | `.AppImage` / `.deb` |

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/Lhy723/star-m3u8.git
cd star-m3u8

# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建应用
pnpm build:win    # Windows
pnpm build:mac    # macOS
pnpm build:linux  # Linux
```

---

## 🛠️ 技术栈

<table>
  <tr>
    <td align="center" width="100">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="48" height="48" alt="Electron">
      <br>Electron
    </td>
    <td align="center" width="100">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg" width="48" height="48" alt="Vue">
      <br>Vue 3
    </td>
    <td align="center" width="100">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript">
      <br>TypeScript
    </td>
    <td align="center" width="100">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pinia/pinia-original.svg" width="48" height="48" alt="Pinia">
      <br>Pinia
    </td>
    <td align="center" width="100">
      <img src="https://element-plus.org/images/element-plus-logo-small.svg" width="48" height="48" alt="Element Plus">
      <br>Element Plus
    </td>
    <td align="center" width="100">
      <img src="https://ffmpeg.org/img/ffmpeg-logo.png" width="48" height="48" alt="FFmpeg">
      <br>FFmpeg
    </td>
  </tr>
</table>

---

## 📁 项目结构

```
star-m3u8/
├── src/
│   ├── main/          # Electron 主进程
│   ├── preload/       # 预加载脚本
│   └── renderer/      # Vue 渲染进程
├── build/             # 构建资源 (图标等)
├── docs/              # 文档与截图
└── resources/         # 应用资源
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ by [Lhy723](https://github.com/Lhy723)

</div>
