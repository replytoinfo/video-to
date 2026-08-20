import { createFFmpeg } from '@ffmpeg/ffmpeg'

export const createFFmpegInstance = async () => {
  console.log('🚀 Creating FFmpeg instance...')
  
  try {
    // Простая стратегия для dev режима - используем CDN для всех браузеров
    const ffmpeg = createFFmpeg({
      log: true,
      logger: ({ message }) => console.log(`[FFmpeg] ${message}`),
      corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
      wasmPath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.wasm',
      workerPath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.worker.js'
    })

    console.log('🔄 Loading FFmpeg...')
    await ffmpeg.load()
    console.log('✅ FFmpeg loaded successfully')
    
    return ffmpeg
  } catch (error) {
    console.error('❌ FFmpeg loading failed:', error)
    throw error
  }
}