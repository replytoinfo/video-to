import { useState } from 'react'
import { toast } from 'sonner'
import FileUploader from '@/components/common/FileUploader'
import ProgressBar from '@/components/common/ProgressBar'
import { downloadFile } from '@/utils/downloadUtils'
import { downloadZip } from '@/utils/zipManager'
import { detectFormat } from '@/utils/formatDetector'
import { imageQuality } from '@/utils/qualityPresets'
import { isSafariBrowser, getBrowserName } from '@/utils/browserUtils'
import { useFFmpeg } from '@/contexts/FFmpegContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image, Download, Package, Info } from 'lucide-react'
// import * as exifr from 'exifr' // TODO: Re-enable for EXIF data processing

export default function ImgToJpgConverter(){
  const [files,setFiles]=useState<File[]>([])
  const [converted,setConverted]=useState<{name:string; url:string; blob:Blob}[]>([])
  const [progress,setProgress]=useState<number[]>([])
  
  const isSafari = isSafariBrowser()
  const browserName = getBrowserName()
  const { ffmpeg, isFFmpegLoaded } = useFFmpeg()

  const handleSelect=(fs:File[])=>{ 
    setFiles(fs); 
    setConverted([]); 
    setProgress(Array(fs.length).fill(0)) 
  }

  const convertSingle=async(file:File,i:number)=>{
    try {
      console.log(`Starting conversion for: ${file.name} (type: ${file.type}, format: ${detectFormat(file)})`)
      setProgress(pr=>{const arr=[...pr];arr[i]=10;return arr})

      const fmt=detectFormat(file)
      let blob:Blob

      if(fmt==='heic'||fmt==='heif'){
        console.log('Detected HEIC/HEIF file, attempting conversion...')
        setProgress(pr=>{const arr=[...pr];arr[i]=20;return arr})

        // Try 1: heic-to library (uses libheif 1.20.2 - newer and more compatible)
        try {
          console.log('Trying heic-to library (libheif 1.20.2)...')
          const { heicTo } = await import('heic-to')

          setProgress(pr=>{const arr=[...pr];arr[i]=30;return arr})

          blob = await heicTo({
            blob: file,
            type: 'image/jpeg',
            quality: 0.8
          })

          console.log('HEIC conversion successful via heic-to:', {
            originalSize: file.size,
            convertedSize: blob.size,
            fileName: file.name
          })
          setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
          toast.success(`Successfully converted ${file.name}`)
        } catch (heicToError) {
          console.log('heic-to failed, trying heic2any fallback...', heicToError)

          // Try 2: heic2any library (fallback)
          try {
            const heic2any = await import('heic2any')
            const heicConverter = heic2any.default || heic2any

            console.log('Using heic2any for conversion...')
            setProgress(pr=>{const arr=[...pr];arr[i]=40;return arr})

            blob = await heicConverter({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8,
              multiple: false
            }) as Blob

            console.log('HEIC conversion successful via heic2any:', {
              originalSize: file.size,
              convertedSize: blob.size,
              fileName: file.name
            })
            setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
            toast.success(`Successfully converted ${file.name} using fallback`)
          } catch (heic2anyError) {
            console.error('heic2any also failed:', heic2anyError)

            // Try 3: Browser native support (last resort)
            try {
              console.log('Trying browser native HEIC support...')
              const img = await loadImage(file)
              console.log('Browser natively loaded HEIC!')
              setProgress(pr=>{const arr=[...pr];arr[i]=60;return arr})
              blob = await toJpeg(img)
              setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
              toast.success(`Successfully converted ${file.name} using browser`)
            } catch (nativeError) {
              console.error('All HEIC conversion methods failed:', {
                heicTo: heicToError,
                heic2any: heic2anyError,
                native: nativeError
              })

              // Show user-friendly error message with instructions
              toast.error(`Cannot convert ${file.name}: HEIC not supported. Please use Windows Photos to export as JPG.`)
              throw new Error(`HEIC file ${file.name} uses a codec not supported. Try: 1) Open in Windows Photos and export as JPG, 2) Use desktop software, 3) Try a different browser.`)
            }
          }
        }
      }
      else if(fmt==='dng'){
        console.log('DNG file detected, passing through as-is')
        // For DNG files, just pass through as-is since we can't convert them
        blob=file
        setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
      }
      else if(fmt==='jpg'||fmt==='jpeg'){
        console.log('JPG file detected, re-encoding for optimization')
        setProgress(pr=>{const arr=[...pr];arr[i]=30;return arr})
        // Re-encode JPG files to optimize quality and remove metadata
        const img=await loadImage(file)
        setProgress(pr=>{const arr=[...pr];arr[i]=60;return arr})
        blob=await toJpeg(img)
        setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
      }
      else {
        console.log(`Converting ${fmt} to JPG`)
        setProgress(pr=>{const arr=[...pr];arr[i]=30;return arr})
        // Convert other formats (PNG, GIF, etc.) to JPG
        const img=await loadImage(file)
        setProgress(pr=>{const arr=[...pr];arr[i]=60;return arr})
        blob=await toJpeg(img)
        setProgress(pr=>{const arr=[...pr];arr[i]=80;return arr})
      }

      // const exif=await exifr.parse(file).catch(()=>null) // TODO: Use EXIF data for orientation
      console.log('Final blob size before state:', blob.size, 'bytes for', file.name)
      const url=URL.createObjectURL(blob)
      setConverted(p=>[...p,{name:file.name.replace(/\.[^/.]+$/,'')+'.jpg',url,blob}])
      setProgress(pr=>{const arr=[...pr];arr[i]=100;return arr})

      console.log(`✅ Successfully converted ${file.name}`)
    } catch (error) {
      console.error('❌ Conversion failed for file:', file.name, error)
      toast.error(`Conversion failed for ${file.name}`)
      setProgress(pr=>{const arr=[...pr];arr[i]=0;return arr})
    }
  }

  const convertHEICWithFFmpeg = async (file: File): Promise<Blob> => {
    if (!isFFmpegLoaded || !ffmpeg) {
      throw new Error('FFmpeg not loaded')
    }

    const inputFileName = `input.${file.name.split('.').pop()?.toLowerCase()}`
    const outputFileName = 'output.jpg'
    
    try {
      // Write input file to FFmpeg filesystem
      const inputData = new Uint8Array(await file.arrayBuffer())
      ffmpeg.FS('writeFile', inputFileName, inputData)
      
      // Convert HEIC to JPG using FFmpeg
      await ffmpeg.run(
        '-i', inputFileName,
        '-f', 'image2',
        '-vcodec', 'mjpeg',
        '-q:v', '2', // High quality
        outputFileName
      )
      
      // Read output file
      const outputData = ffmpeg.FS('readFile', outputFileName)

      // Cleanup files
      ffmpeg.FS('unlink', inputFileName)
      ffmpeg.FS('unlink', outputFileName)

      // For FFmpeg v0.10.x, outputData is already Uint8Array - use it directly
      return new Blob([outputData], { type: 'image/jpeg' })
    } catch (error) {
      // Cleanup on error
      try {
        ffmpeg.FS('unlink', inputFileName)
        ffmpeg.FS('unlink', outputFileName)
      } catch {
        // Ignore cleanup errors
      }
      
      throw error
    }
  }

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img') as HTMLImageElement
      img.onload = () => {
        URL.revokeObjectURL(img.src) // Clean up object URL
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src) // Clean up object URL
        reject(new Error('Failed to load image'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const toJpeg = (img: HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height)
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Created blob size:', blob.size, 'bytes')
          resolve(blob)
        } else {
          console.error('Failed to create blob from canvas')
          reject(new Error('Failed to create blob'))
        }
      }, 'image/jpeg', imageQuality.best)
    })
  }

  const convertAll=async()=>{
    console.log('Starting conversion of', files.length, 'files')
    console.log('Files:', files.map(f => ({ name: f.name, type: f.type, size: f.size })))

    for(let i=0;i<files.length;i++) {
      console.log(`Converting file ${i+1}/${files.length}:`, files[i].name)
      await convertSingle(files[i],i)
    }

    console.log('All conversions completed')
  }

  const downloadAll=async()=>{
    try {
      console.log('Creating ZIP with files:', converted.map(f => ({name: f.name, size: f.blob.size})))
      const list = converted.map(f => ({name: f.name, blob: f.blob}))
      await downloadZip(list, 'images.zip')
    } catch (error) {
      console.error('Failed to create ZIP:', error)
    }
  }

  return(
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Image to JPG Converter
          </CardTitle>
          <CardDescription>
            Convert HEIC, PNG, JPG, and other image formats to optimized JPG with best quality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSafari && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Safari User Notice</p>
                    <p>
                      {browserName} uses a special download method for ZIP files to ensure reliable downloads. 
                      Large files may take a moment to process before downloading.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <FileUploader 
            onSelect={handleSelect} 
            accept="image/*" 
            multiple
            key="img-file-uploader"
          />
          
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={convertAll} className="flex-1">
                  Convert {files.length} image{files.length > 1 ? 's' : ''}
                </Button>
                {converted.length > 1 && (
                  <Button onClick={downloadAll} variant="outline" className="flex-shrink-0">
                    <Package className="h-4 w-4 mr-2" />
                    Download as ZIP
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {files.map((f,i)=>(
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{f.name}</span>
                      <Badge variant="secondary">{progress[i] || 0}%</Badge>
                    </div>
                    <ProgressBar value={progress[i]||0}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {converted.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Converted Images</CardTitle>
                  {converted.length > 1 && (
                    <Button onClick={downloadAll} variant="outline" size="sm">
                      <Package className="h-4 w-4 mr-2" />
                      Download as ZIP
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {converted.map(f=>(
                  <div key={f.url} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="truncate text-sm">{f.name}</span>
                    <Button onClick={()=>downloadFile(f.url,f.name)} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

