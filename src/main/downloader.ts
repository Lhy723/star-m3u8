import { dialog, BrowserWindow, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import { getSettings } from './settings'

ffmpeg.setFfmpegPath(ffmpegPath.path)

export interface DownloadTask {
  id: string
  url: string
  filename: string
  savePath: string
  status: 'pending' | 'downloading' | 'paused' | 'merging' | 'completed' | 'error'
  progress: number
  speed: string
  errorMessage?: string
  totalSegments: number
  downloadedSegments: number
}

interface M3U8Info {
  isMaster: boolean
  segments: string[]
  targetDuration: number
  variantStreams?: { bandwidth: number; uri: string }[]
}

interface DownloadOptions {
  concurrency?: number
  maxRetries?: number
  timeout?: number
  headers?: Record<string, string>
}

const DEFAULT_OPTIONS: Required<DownloadOptions> = {
  concurrency: 5,
  maxRetries: 3,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}

export async function selectDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
}

function resolveUrl(baseUrl: string, relativeUrl: string): string {
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl
  }
  const base = new URL(baseUrl)
  if (relativeUrl.startsWith('//')) {
    return base.protocol + relativeUrl
  }
  if (relativeUrl.startsWith('/')) {
    return base.origin + relativeUrl
  }
  const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)
  return base.origin + basePath + relativeUrl
}

async function fetchM3U8Content(url: string, headers?: Record<string, string>): Promise<string> {
  const response = await axios.get(url, {
    headers: { ...DEFAULT_OPTIONS.headers, ...headers },
    timeout: DEFAULT_OPTIONS.timeout,
    responseType: 'text'
  })
  return response.data
}

function parseM3U8(content: string, baseUrl: string): M3U8Info {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const result: M3U8Info = {
    isMaster: false,
    segments: [],
    targetDuration: 0
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      result.isMaster = true
      if (!result.variantStreams) {
        result.variantStreams = []
      }
      const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/)
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0
      const nextLine = lines[i + 1]
      if (nextLine && !nextLine.startsWith('#')) {
        result.variantStreams.push({
          bandwidth,
          uri: resolveUrl(baseUrl, nextLine)
        })
      }
    } else if (line.startsWith('#EXTINF:')) {
      const nextLine = lines[i + 1]
      if (nextLine && !nextLine.startsWith('#')) {
        result.segments.push(resolveUrl(baseUrl, nextLine))
      }
    } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      const durationMatch = line.match(/#EXT-X-TARGETDURATION:(\d+)/)
      if (durationMatch) {
        result.targetDuration = parseInt(durationMatch[1], 10)
      }
    }
  }

  return result
}

async function downloadSegment(
  url: string,
  outputPath: string,
  tempDir: string,
  headers?: Record<string, string>,
  retries = DEFAULT_OPTIONS.maxRetries
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!fs.existsSync(tempDir)) {
        return false
      }

      const response = await axios.get(url, {
        headers: { ...DEFAULT_OPTIONS.headers, ...headers },
        timeout: DEFAULT_OPTIONS.timeout,
        responseType: 'arraybuffer'
      })

      if (!fs.existsSync(tempDir)) {
        return false
      }

      const dir = path.dirname(outputPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(outputPath, Buffer.from(response.data))
      return true
    } catch (error) {
      if (attempt === retries) {
        console.error(`Failed to download segment: ${url}`, error)
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  return false
}

async function mergeToMp4(
  segmentDir: string,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(segmentDir)) {
      resolve(false)
      return
    }

    const segmentFiles = fs
      .readdirSync(segmentDir)
      .filter((f) => f.endsWith('.ts'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('.ts', ''), 10)
        const numB = parseInt(b.replace('.ts', ''), 10)
        return numA - numB
      })

    if (segmentFiles.length === 0) {
      resolve(false)
      return
    }

    const concatListPath = path.join(segmentDir, 'concat.txt')
    const concatContent = segmentFiles.map((f) => `file '${path.join(segmentDir, f)}'`).join('\n')
    fs.writeFileSync(concatListPath, concatContent)

    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy', '-movflags +faststart'])
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 100))
        }
      })
      .on('end', () => {
        if (fs.existsSync(concatListPath)) {
          fs.unlinkSync(concatListPath)
        }
        resolve(true)
      })
      .on('error', (err) => {
        console.error('FFmpeg merge error:', err)
        if (fs.existsSync(concatListPath)) {
          fs.unlinkSync(concatListPath)
        }
        resolve(false)
      })
      .run()
  })
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`
  }
}

export class DownloadManager {
  private tasks = new Map<string, DownloadTask>()
  private cancelFlags = new Map<string, boolean>()
  private pauseFlags = new Map<string, boolean>()
  private mainWindow: BrowserWindow | null = null

  setMainWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  private send(channel: string, data: unknown): void {
    console.log(`[DownloadManager] Sending to ${channel}:`, data)
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  async startDownload(item: DownloadTask): Promise<void> {
    console.log('[DownloadManager] Starting download:', item.id)

    const task: DownloadTask = {
      ...item,
      status: 'downloading',
      progress: 0,
      speed: '0 B/s',
      totalSegments: 0,
      downloadedSegments: 0
    }

    this.tasks.set(task.id, task)
    this.pauseFlags.set(task.id, false)
    this.cancelFlags.set(task.id, false)

    let tempDir = ''

    try {
      tempDir = path.join(app.getPath('temp'), 'star-m3u8', task.id)
      console.log('[DownloadManager] Temp directory:', tempDir)

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      console.log('[DownloadManager] Fetching M3U8 content from:', task.url)
      let m3u8Url = task.url
      let m3u8Content = await fetchM3U8Content(m3u8Url)
      let m3u8Info = parseM3U8(m3u8Content, m3u8Url)
      console.log('[DownloadManager] Parsed M3U8, isMaster:', m3u8Info.isMaster)

      if (m3u8Info.isMaster && m3u8Info.variantStreams && m3u8Info.variantStreams.length > 0) {
        m3u8Info.variantStreams.sort((a, b) => b.bandwidth - a.bandwidth)
        m3u8Url = m3u8Info.variantStreams[0].uri
        console.log('[DownloadManager] Selected variant stream:', m3u8Url)
        m3u8Content = await fetchM3U8Content(m3u8Url)
        m3u8Info = parseM3U8(m3u8Content, m3u8Url)
      }

      if (m3u8Info.segments.length === 0) {
        throw new Error('未找到视频分片')
      }

      task.totalSegments = m3u8Info.segments.length
      console.log('[DownloadManager] Total segments:', task.totalSegments)

      this.send('download-status', {
        id: task.id,
        status: 'downloading',
        totalSegments: task.totalSegments
      })

      // 从用户设置中读取并发数和重试次数
      const settings = getSettings()
      const concurrency = parseInt(settings.concurrent, 10) || DEFAULT_OPTIONS.concurrency
      const maxRetries = parseInt(settings.retry, 10) || DEFAULT_OPTIONS.maxRetries
      let downloadedCount = 0
      let totalBytes = 0
      const startTime = Date.now()
      const segments = m3u8Info.segments

      const downloadWithPauseCheck = async (
        segmentUrl: string,
        index: number
      ): Promise<boolean> => {
        while (this.pauseFlags.get(task.id) && !this.cancelFlags.get(task.id)) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (this.cancelFlags.get(task.id) || !fs.existsSync(tempDir)) {
          return false
        }

        const segmentPath = path.join(tempDir, `${String(index).padStart(6, '0')}.ts`)
        const success = await downloadSegment(segmentUrl, segmentPath, tempDir, undefined, maxRetries)

        if (this.cancelFlags.get(task.id)) {
          return false
        }

        if (success) {
          const stats = fs.statSync(segmentPath)
          totalBytes += stats.size
          downloadedCount++
          task.downloadedSegments = downloadedCount
          task.progress = Math.round((downloadedCount / segments.length) * 100)

          const elapsed = (Date.now() - startTime) / 1000
          task.speed = formatSpeed(totalBytes / elapsed)

          this.send('download-progress', {
            id: task.id,
            progress: task.progress,
            speed: task.speed,
            downloadedSegments: downloadedCount,
            totalSegments: segments.length
          })
        }

        return success
      }

      for (let i = 0; i < segments.length; i += concurrency) {
        if (this.cancelFlags.get(task.id)) {
          console.log('[DownloadManager] Download cancelled')
          return
        }

        const batch = segments.slice(i, Math.min(i + concurrency, segments.length))
        const promises = batch.map((url, batchIndex) => downloadWithPauseCheck(url, i + batchIndex))
        await Promise.all(promises)
      }

      if (this.cancelFlags.get(task.id)) {
        return
      }

      console.log('[DownloadManager] All segments downloaded, merging...')
      task.status = 'merging'
      this.send('download-status', { id: task.id, status: 'merging' })

      const outputFileName = task.filename.endsWith('.mp4') ? task.filename : `${task.filename}.mp4`
      const outputPath = path.join(task.savePath, outputFileName)

      const mergeSuccess = await mergeToMp4(tempDir, outputPath, (progress) => {
        this.send('download-progress', {
          id: task.id,
          progress: Math.round(task.progress + ((100 - task.progress) * progress) / 100),
          speed: '正在合并...'
        })
      })

      if (!mergeSuccess) {
        throw new Error('视频合并失败')
      }

      console.log('[DownloadManager] Merge completed, cleaning up...')
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }

      task.status = 'completed'
      task.progress = 100
      this.send('download-status', { id: task.id, status: 'completed' })
      this.cleanup(task.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '下载失败'
      console.error('[DownloadManager] Download error:', errorMessage)
      task.status = 'error'
      task.errorMessage = errorMessage
      this.send('download-error', { id: task.id, error: errorMessage })
      this.cleanup(task.id)
    }
  }

  private cleanup(id: string): void {
    this.tasks.delete(id)
    this.cancelFlags.delete(id)
    this.pauseFlags.delete(id)
  }

  pauseDownload(id: string): void {
    console.log('[DownloadManager] Pausing download:', id)
    this.pauseFlags.set(id, true)
    const task = this.tasks.get(id)
    if (task) {
      task.status = 'paused'
      this.send('download-status', { id, status: 'paused' })
    }
  }

  resumeDownload(id: string): void {
    console.log('[DownloadManager] Resuming download:', id)
    this.pauseFlags.set(id, false)
    const task = this.tasks.get(id)
    if (task) {
      task.status = 'downloading'
      this.send('download-status', { id, status: 'downloading' })
    }
  }

  cancelDownload(id: string): void {
    console.log('[DownloadManager] Cancelling download:', id)
    this.cancelFlags.set(id, true)
    this.tasks.delete(id)
    this.pauseFlags.delete(id)

    const tempDir = path.join(app.getPath('temp'), 'star-m3u8', id)
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (error) {
        console.error('[DownloadManager] Failed to clean temp dir:', error)
      }
    }
  }

  getTask(id: string): DownloadTask | undefined {
    return this.tasks.get(id)
  }
}
