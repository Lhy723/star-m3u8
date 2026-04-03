import { dialog, BrowserWindow, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import { getSettings } from './settings'

const FFMPEG_BINARY_NAME = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

let ffmpegConfigured = false

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.length > 0) {
    return error
  }

  try {
    const serialized = JSON.stringify(error)
    return serialized === undefined ? fallback : serialized
  } catch {
    return fallback
  }
}

function resolveFfmpegPath(): string {
  let loadError: unknown
  const platformDir = `${process.platform}-${process.arch}`
  const candidateSet = new Set<string>()

  const addCandidate = (candidate: string | undefined): void => {
    if (!candidate) {
      return
    }
    candidateSet.add(path.normalize(candidate))
  }

  const isInsidePackedAsar = (candidate: string): boolean => {
    const normalized = path.normalize(candidate)
    return /app\.asar([\\/]|$)/i.test(normalized) && !/app\.asar\.unpacked([\\/]|$)/i.test(normalized)
  }

  const isSpawnableBinary = (candidate: string): boolean => {
    if (isInsidePackedAsar(candidate)) {
      return false
    }

    if (!fs.existsSync(candidate)) {
      return false
    }

    try {
      return fs.statSync(candidate).isFile()
    } catch {
      return false
    }
  }

  const toAsarUnpackedPath = (candidate: string): string | undefined => {
    if (!candidate.includes('app.asar')) {
      return undefined
    }
    return candidate.replace(/app\.asar([\\/])/g, 'app.asar.unpacked$1')
  }

  const findExisting = (candidates: Iterable<string>): string | undefined => {
    for (const candidate of candidates) {
      if (isSpawnableBinary(candidate)) {
        return candidate
      }
    }
    return undefined
  }

  try {
    const installer = require('@ffmpeg-installer/ffmpeg') as { path?: string }
    if (installer.path) {
      if (!isInsidePackedAsar(installer.path)) {
        addCandidate(installer.path)
      }
      addCandidate(toAsarUnpackedPath(installer.path))
    }
  } catch (error) {
    loadError = error
  }

  const resourcesCandidates = [
    process.resourcesPath,
    path.join(path.dirname(process.execPath), 'resources')
  ]

  try {
    const appPath = app.getAppPath()
    addCandidate(
      path.join(
        appPath,
        '..',
        'app.asar.unpacked',
        'node_modules',
        '@ffmpeg-installer',
        platformDir,
        FFMPEG_BINARY_NAME
      )
    )
  } catch {
    // ignore appPath access failures before app is ready
  }

  for (const resourcesPath of resourcesCandidates) {
    addCandidate(
      path.join(
        resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffmpeg-installer',
        platformDir,
        FFMPEG_BINARY_NAME
      )
    )
    addCandidate(path.join(resourcesPath, 'node_modules', '@ffmpeg-installer', platformDir, FFMPEG_BINARY_NAME))
  }

  addCandidate(path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', platformDir, FFMPEG_BINARY_NAME))

  const existingPath = findExisting(candidateSet)
  if (existingPath) {
    return existingPath
  }

  const checkedPaths = Array.from(candidateSet)
    .map((candidate) => `"${candidate}"`)
    .join(', ')

  const fallbackCandidates = [
    path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '@ffmpeg-installer',
      platformDir,
      FFMPEG_BINARY_NAME
    ),
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', platformDir, FFMPEG_BINARY_NAME)
  ]

  const fallbackPath = findExisting(fallbackCandidates)
  if (fallbackPath) {
    return fallbackPath
  }

  const reason =
    loadError === undefined
      ? 'ffmpeg binary is missing from packaged resources'
      : getErrorMessage(loadError, 'unable to load @ffmpeg-installer/ffmpeg')

  throw new Error(`Unable to initialize ffmpeg (${reason}). Checked: ${checkedPaths}`)
}

function ensureFfmpegConfigured(): void {
  if (ffmpegConfigured) {
    return
  }

  const ffmpegBinaryPath = resolveFfmpegPath()
  ffmpeg.setFfmpegPath(ffmpegBinaryPath)
  ffmpegConfigured = true
  console.log('[DownloadManager] FFmpeg path:', ffmpegBinaryPath)
}

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
  initSegment?: string
  targetDuration: number
  variantStreams?: { bandwidth: number; uri: string }[]
}

interface SegmentEntry {
  url: string
  fileName: string
}

interface MergeResult {
  success: boolean
  error?: string
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
    } else if (line.startsWith('#EXT-X-MAP:')) {
      const uriMatch = line.match(/URI="([^"]+)"/)
      if (uriMatch?.[1]) {
        result.initSegment = resolveUrl(baseUrl, uriMatch[1])
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

function getSegmentExtension(segmentUrl: string): string {
  try {
    const pathname = new URL(segmentUrl).pathname
    const ext = path.extname(pathname).toLowerCase()
    if (ext && ext.length <= 8) {
      return ext
    }
  } catch {
    // fall back to default extension
  }
  return '.ts'
}

function buildSegmentEntries(m3u8Info: M3U8Info): SegmentEntry[] {
  const entries: SegmentEntry[] = []

  if (m3u8Info.initSegment) {
    entries.push({
      url: m3u8Info.initSegment,
      fileName: `000000_init${getSegmentExtension(m3u8Info.initSegment)}`
    })
  }

  for (let i = 0; i < m3u8Info.segments.length; i++) {
    const segmentUrl = m3u8Info.segments[i]
    const sequence = i + (m3u8Info.initSegment ? 1 : 0)
    entries.push({
      url: segmentUrl,
      fileName: `${String(sequence).padStart(6, '0')}${getSegmentExtension(segmentUrl)}`
    })
  }

  return entries
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
): Promise<MergeResult> {
  return new Promise((resolve) => {
    if (!fs.existsSync(segmentDir)) {
      resolve({ success: false, error: 'Segment directory does not exist.' })
      return
    }

    const segmentFiles = fs
      .readdirSync(segmentDir)
      .filter((f) => /^\d{6}/.test(f))
      .sort((a, b) => a.localeCompare(b))

    if (segmentFiles.length === 0) {
      resolve({ success: false, error: 'No local segment files found.' })
      return
    }

    const concatListPath = path.join(segmentDir, 'concat.txt')
    const concatContent = segmentFiles.map((f) => `file '${path.join(segmentDir, f)}'`).join('\n')
    fs.writeFileSync(concatListPath, concatContent)

    const cleanup = (): void => {
      if (fs.existsSync(concatListPath)) {
        fs.unlinkSync(concatListPath)
      }
    }

    const runMerge = (copyOnly: boolean): void => {
      const command = ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .output(outputPath)
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 100))
          }
        })
        .on('end', () => {
          cleanup()
          resolve({ success: true })
        })
        .on('error', (err) => {
          const errorMessage = getErrorMessage(err, 'ffmpeg merge failed')
          console.error(
            copyOnly ? 'FFmpeg merge copy mode error:' : 'FFmpeg merge re-encode mode error:',
            err
          )

          if (copyOnly) {
            console.warn('[DownloadManager] Falling back to ffmpeg re-encode merge mode')
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath)
            }
            runMerge(false)
            return
          }

          cleanup()
          resolve({
            success: false,
            error: `ffmpeg copy + re-encode merge failed (${errorMessage})`
          })
        })

      if (copyOnly) {
        command.outputOptions(['-c copy', '-movflags +faststart'])
      } else {
        command.outputOptions(['-c:v libx264', '-c:a aac', '-movflags +faststart'])
      }

      command.run()
    }

    runMerge(true)
  })
}

async function mergeM3u8Directly(
  m3u8Url: string,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<MergeResult> {
  return new Promise((resolve) => {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath)
    }

    ffmpeg()
      .input(m3u8Url)
      .inputOptions(['-user_agent', DEFAULT_OPTIONS.headers['User-Agent']])
      .outputOptions(['-c copy', '-movflags +faststart'])
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 100))
        }
      })
      .on('end', () => resolve({ success: true }))
      .on('error', (err) => {
        console.error('FFmpeg direct m3u8 merge error:', err)
        resolve({
          success: false,
          error: `ffmpeg direct m3u8 merge failed (${getErrorMessage(err, 'unknown error')})`
        })
      })
      .run()
  })
}

function buildLocalPlaylistContent(
  content: string,
  baseUrl: string,
  segmentEntries: SegmentEntry[]
): string {
  const segmentMap = new Map<string, string>()
  for (const entry of segmentEntries) {
    segmentMap.set(entry.url, entry.fileName)
  }

  const lines = content.split(/\r?\n/)
  const mappedLines = lines.map((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return line
    }

    if (trimmed.startsWith('#EXT-X-MAP:')) {
      const uriMatch = trimmed.match(/URI="([^"]+)"/)
      if (!uriMatch?.[1]) {
        return line
      }

      const absoluteUrl = resolveUrl(baseUrl, uriMatch[1])
      const localFileName = segmentMap.get(absoluteUrl)
      if (!localFileName) {
        return line
      }

      return line.replace(/URI="([^"]+)"/, `URI="${localFileName}"`)
    }

    if (trimmed.startsWith('#')) {
      return line
    }

    const absoluteUrl = resolveUrl(baseUrl, trimmed)
    const localFileName = segmentMap.get(absoluteUrl)
    return localFileName ?? line
  })

  return mappedLines.join('\n')
}

async function mergeFromLocalPlaylist(
  playlistContent: string,
  playlistBaseUrl: string,
  segmentEntries: SegmentEntry[],
  tempDir: string,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<MergeResult> {
  return new Promise((resolve) => {
    const localPlaylistPath = path.join(tempDir, 'local-playlist.m3u8')
    const localPlaylistContent = buildLocalPlaylistContent(
      playlistContent,
      playlistBaseUrl,
      segmentEntries
    )

    fs.writeFileSync(localPlaylistPath, localPlaylistContent)

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath)
    }

    ffmpeg()
      .input(localPlaylistPath)
      .inputOptions(['-protocol_whitelist', 'file,pipe,data,crypto,http,https,tcp,tls'])
      .outputOptions(['-c copy', '-movflags +faststart'])
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 100))
        }
      })
      .on('end', () => resolve({ success: true }))
      .on('error', (err) => {
        console.error('FFmpeg local playlist merge error:', err)
        resolve({
          success: false,
          error: `ffmpeg local playlist merge failed (${getErrorMessage(err, 'unknown error')})`
        })
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
        throw new Error('No video segments found in m3u8 playlist.')
      }

      ensureFfmpegConfigured()

      const segmentEntries = buildSegmentEntries(m3u8Info)
      task.totalSegments = segmentEntries.length
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
      const segments = segmentEntries

      const downloadWithPauseCheck = async (
        segment: SegmentEntry
      ): Promise<boolean> => {
        while (this.pauseFlags.get(task.id) && !this.cancelFlags.get(task.id)) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (this.cancelFlags.get(task.id) || !fs.existsSync(tempDir)) {
          return false
        }

        const segmentPath = path.join(tempDir, segment.fileName)
        const success = await downloadSegment(segment.url, segmentPath, tempDir, undefined, maxRetries)

        if (this.cancelFlags.get(task.id)) {
          return false
        }

        if (success) {
          const stats = fs.statSync(segmentPath)
          totalBytes += stats.size
          downloadedCount++
          task.downloadedSegments = downloadedCount
          task.progress = Math.round((downloadedCount / segments.length) * 95)

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
        const promises = batch.map((segment) => downloadWithPauseCheck(segment))
        const batchResults = await Promise.all(promises)

        if (batchResults.some((result) => !result)) {
          throw new Error('Some segments failed to download, please retry the task.')
        }
      }

      if (this.cancelFlags.get(task.id)) {
        return
      }

      console.log('[DownloadManager] All segments downloaded, merging...')
      task.status = 'merging'
      this.send('download-status', { id: task.id, status: 'merging' })

      const outputFileName = task.filename.endsWith('.mp4') ? task.filename : `${task.filename}.mp4`
      const outputPath = path.join(task.savePath, outputFileName)

      const mergeAttempts: string[] = []

      let mergeResult = await mergeFromLocalPlaylist(
        m3u8Content,
        m3u8Url,
        segmentEntries,
        tempDir,
        outputPath,
        (progress) => {
          this.send('download-progress', {
            id: task.id,
            progress: Math.round(task.progress + ((100 - task.progress) * progress) / 100),
            speed: 'Merging...'
          })
        }
      )

      if (!mergeResult.success) {
        mergeAttempts.push(mergeResult.error ?? 'local playlist merge failed')
      }

      if (!mergeResult.success) {
        mergeResult = await mergeToMp4(tempDir, outputPath, (progress) => {
          this.send('download-progress', {
            id: task.id,
            progress: Math.round(task.progress + ((100 - task.progress) * progress) / 100),
            speed: 'Merging...'
          })
        })
      }

      if (!mergeResult.success) {
        mergeAttempts.push(mergeResult.error ?? 'local segment merge failed')
      }

      if (!mergeResult.success) {
        console.warn('[DownloadManager] Local segment merge failed, trying direct m3u8 merge fallback')
        mergeResult = await mergeM3u8Directly(m3u8Url, outputPath, (progress) => {
          this.send('download-progress', {
            id: task.id,
            progress: Math.round(task.progress + ((100 - task.progress) * progress) / 100),
            speed: 'Merging...'
          })
        })
      }

      if (!mergeResult.success) {
        mergeAttempts.push(mergeResult.error ?? 'direct m3u8 merge failed')
      }

      if (!mergeResult.success) {
        throw new Error(
          `Failed to merge video. Attempts: ${mergeAttempts.join(' | ')}`
        )
      }

      this.send('download-progress', {
        id: task.id,
        progress: 100,
        speed: 'Done'
      })

      console.log('[DownloadManager] Merge completed, cleaning up...')
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }

      task.status = 'completed'
      task.progress = 100
      this.send('download-status', { id: task.id, status: 'completed' })
      this.cleanup(task.id)
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Download failed.')
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
