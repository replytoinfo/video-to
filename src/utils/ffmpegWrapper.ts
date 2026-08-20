import type { FFmpeg } from '@ffmpeg/ffmpeg'

export const runFFmpeg = async (ffmpeg: FFmpeg, args: string[], onProgress?: (p:number)=>void) => {
  if (!ffmpeg || !ffmpeg.loaded) throw new Error('FFmpeg not loaded')
  let handler: ((e:{progress:number})=>void) | null = null
  if (onProgress) {
    handler = ({ progress }) => onProgress(Math.round(progress * 100))
    ffmpeg.on('progress', handler)
  }
  try {
    await ffmpeg.run(...args)
  } finally {
    if (handler) ffmpeg.off('progress', handler)
  }
}
