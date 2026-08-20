import React, { useState, useCallback, DragEvent } from 'react'
import { createFFmpegInstance } from '../../utils/ffmpegUtils'
import { fetchFile } from '@ffmpeg/ffmpeg'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ProgressBar from '@/components/common/ProgressBar'
import { Upload, FileVideo } from 'lucide-react'
import { generateRandomFileName } from '@/utils/downloadUtils'

const MovToMp4 = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileConversion = useCallback(async (file: File) => {
    if (!file) return
    setIsLoading(true)
    setProgress(0)
    setError(null)
    
    // Create a timeout to prevent infinite hanging
    const timeoutId = setTimeout(() => {
      setError('Conversion timeout - file may be too complex or corrupted')
      setIsLoading(false)
    }, 600000) // 10 minutes timeout for large HEVC files
    
    try {
      setLoadingStep('Initializing FFmpeg...')
      const ffmpeg = await createFFmpegInstance()
      setProgress(10)
      
      // FFmpeg v0.10.x doesn't have .on() method, set progress manually
      setProgress(25)
      
      setLoadingStep('Processing file...')
      const ext = file.name.toLowerCase().endsWith('.mp4') ? 'mp4' : 'mov'
      const input = `input.${ext}`
      const output = 'output.mp4'
      
      setProgress(50)
      ffmpeg.FS('writeFile', input, await fetchFile(file))
      
      setLoadingStep('Converting video...')
      setProgress(75)
      
      const isAlreadyMp4 = file.name.toLowerCase().endsWith('.mp4')

      if (!isAlreadyMp4) {
        // MOV→MP4: try stream copy first, fallback to re-encoding
        try {
          console.log('Attempting stream copy for MOV file...')
          await ffmpeg.run(
            '-i', input,
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            output
          )
          console.log('Stream copy successful')
        } catch (streamCopyError) {
          console.log('Stream copy failed, trying re-encoding...', streamCopyError)
          try { ffmpeg.FS('unlink', output) } catch (_) {}

          await ffmpeg.run(
            '-i', input,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-c:a', 'aac',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-fflags', '+genpts',
            '-max_muxing_queue_size', '1024',
            output
          )
          console.log('Re-encoding successful')
        }
      } else {
        // MP4 HEVC→H.264: always re-encode
        console.log('Re-encoding MP4 (likely HEVC) to H.264...')
        await ffmpeg.run(
          '-i', input,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '23',
          '-c:a', 'aac',
          '-movflags', '+faststart',
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts',
          '-max_muxing_queue_size', '1024',
          output
        )
        console.log('Re-encoding successful')
      }
      
      setLoadingStep('Preparing download...')
      setProgress(90)
      const data = ffmpeg.FS('readFile', output)
      ffmpeg.FS('unlink', input)
      ffmpeg.FS('unlink', output)
      const blob = new Blob([data], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateRandomFileName('mp4')
      a.click()
      URL.revokeObjectURL(url)
      setLoadingStep('Complete!')
      
      clearTimeout(timeoutId) // Clear timeout on success
    } catch (err: any) {
      console.error('Conversion error:', err)
      clearTimeout(timeoutId) // Clear timeout on error
      
      // Provide more specific error messages
      if (err.message?.includes('hevc') || err.message?.includes('HEVC')) {
        setError('HEVC/H.265 video conversion failed. This codec can be challenging to process.')
      } else if (err.message?.includes('timeout')) {
        setError('Conversion timed out. Please try with a smaller file or different format.')
      } else {
        setError(`Conversion failed: ${err.message}`)
      }
    } finally {
      setIsLoading(false)
      setProgress(0)
      setLoadingStep('')
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => {
      const name = file.name.toLowerCase()
      return name.endsWith('.mov') || name.endsWith('.mp4')
    })

    if (videoFile) {
      handleFileConversion(videoFile)
    } else {
      setError('Please drop a MOV or MP4 file')
    }
  }, [handleFileConversion])

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            MOV/HEVC to MP4 Converter
          </CardTitle>
          <CardDescription>
            Convert MOV and HEVC (H.265) files to compatible MP4 (H.264)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div 
              className={`flex items-center justify-center rounded-lg p-8 transition-colors bg-secondary/30 ${
                isDragOver 
                  ? 'border-2 border-dashed border-primary bg-primary/10' 
                  : 'hover:bg-secondary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label className="cursor-pointer text-center w-full">
                <input
                  type="file"
                  accept=".mov,.mp4"
                  onChange={e => handleFileConversion(e.target.files?.[0] as File)}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className={`h-8 w-8 mx-auto ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className={`text-sm ${
                    isDragOver ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {isLoading 
                      ? 'Processing...' 
                      : isDragOver 
                        ? 'Drop MOV file here' 
                        : 'Click to select or drag and drop MOV file'
                    }
                  </p>
                </div>
              </label>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{loadingStep}</span>
                  <span>{progress}%</span>
                </div>
                <ProgressBar value={progress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MovToMp4
