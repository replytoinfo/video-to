import { createFFmpeg } from '@ffmpeg/ffmpeg'
import { isSafariBrowser } from './browserUtils'

// wasmPath/workerPath не передаём: браузерный рантайм @ffmpeg/ffmpeg 0.10.1
// игнорирует их и всегда выводит из corePath (getCreateFFmpegCore.js)
const CDN_CORE_PATH = 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js'
const LOCAL_CORE_PATH = '/ffmpeg-core.js'

const buildFFmpeg = (corePath: string) => createFFmpeg({
  log: true,
  logger: ({ message }) => console.log(`[FFmpeg] ${message}`),
  corePath
})

export const createFFmpegInstance = async () => {
  console.log('🚀 Creating FFmpeg instance...')

  // Safari/WebKit не умеет в локальные blob-ресурсы для WASM — сразу CDN
  const corePath = isSafariBrowser() ? CDN_CORE_PATH : LOCAL_CORE_PATH
  const ffmpeg = buildFFmpeg(corePath)

  try {
    console.log(`🔄 Loading FFmpeg from ${corePath}...`)
    await ffmpeg.load()
    console.log('✅ FFmpeg loaded successfully')
    return ffmpeg
  } catch (error) {
    if (corePath === CDN_CORE_PATH) {
      console.error('❌ FFmpeg loading failed:', error)
      throw error
    }

    console.warn('⚠️ Local FFmpeg core failed to load, falling back to CDN:', error)
    const fallback = buildFFmpeg(CDN_CORE_PATH)
    await fallback.load()
    console.log('✅ FFmpeg loaded successfully (CDN fallback)')
    return fallback
  }
}
