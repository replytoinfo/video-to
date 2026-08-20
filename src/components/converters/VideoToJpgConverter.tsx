import React, { useState, useEffect } from 'react'
import FileUploader from '@/components/common/FileUploader'
import ProgressBar from '@/components/common/ProgressBar'
import { fetchFile } from '@ffmpeg/ffmpeg'
import { useFFmpeg } from '@/contexts/FFmpegContext'
import { toast } from 'sonner'
import { generateRandomFileName } from '@/utils/downloadUtils'
import JSZip from 'jszip'

export default function VideoToJpgConverter(){
  const [videoFile,setVideoFile]=useState<File|null>(null)
  const [extractedFrames,setExtractedFrames]=useState<any[]>([])
  const [isProcessing,setIsProcessing]=useState(false)
  const [progress,setProgress]=useState(0)
  const [frameCount,setFrameCount]=useState(30)
  const { ffmpeg, isFFmpegLoaded } = useFFmpeg()

  const frameOptions:number[]=[]
  for(let i=5;i<=500;i+=25) frameOptions.push(i)


  const handleFileSelect=(files:File[])=>{
    const file=files[0]
    if(!file) return
    if(!file.type.startsWith('video/')){
      toast.error('Please select a valid video file (MP4, MOV, AVI, etc.)')
      return
    }
    if(file.size>1000*1024*1024){
      toast.error('File too large. Please select a video smaller than 1000MB.')
      return
    }
    setVideoFile(file)
    setExtractedFrames([])
  }

  const extractFrames=async()=>{
    if(!videoFile||!ffmpeg||!isFFmpegLoaded||isProcessing) return
    setIsProcessing(true)
    setProgress(0)
    setExtractedFrames([])
    const instance=ffmpeg
    const inputName='input_video.mp4'
    const outputPattern='frame_%04d.jpg'
    
    // Create manual progress tracking for FFmpeg v0.10.x
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90; // Don't go beyond 90% until actual completion
        return prev + Math.random() * 10;
      });
    }, 500);
    
    try{
      setProgress(10);
      instance.FS('writeFile', inputName, await fetchFile(videoFile))
      setProgress(30);
      
      await instance.run('-i',inputName,'-vframes',frameCount.toString(),'-q:v','1','-y',outputPattern)
      setProgress(70);
      
      const files=instance.FS('readdir', '/') as string[]
      const frameFiles=files.filter(f=>f.startsWith('frame_')&&f.endsWith('.jpg'))
      const frames:any[]=[]
      setProgress(80);
      
      for(let i=0;i<frameFiles.length;i++){
        const fileName=frameFiles[i]
        const data=instance.FS('readFile', fileName)
        const blob=new Blob([data],{type:'image/jpeg'})
        const url=URL.createObjectURL(blob)
        frames.push({id:i,name:fileName,blob,url,size:data.length})
        instance.FS('unlink', fileName)
        
        // Update progress during frame processing
        if (i % 5 === 0) {
          setProgress(80 + (i / frameFiles.length) * 15);
        }
      }
      
      instance.FS('unlink', inputName)
      setExtractedFrames(frames)
      setProgress(100);
      
      setTimeout(() => setProgress(0), 1000); // Reset after completion
    }catch(e:any){
      console.error('❌ Detailed error:',{message:e.message,name:e.name,stack:e.stack,videoFile:videoFile?.name,frameCount})
      const errorMsg=e.message||e.toString()||'Unknown FFmpeg error'
      toast.error(`Extraction failed: ${errorMsg}. Please try a different video file or smaller frame count.`)
    }finally{
      clearInterval(progressTimer);
      setIsProcessing(false)
    }
  }

  const downloadFrame=(frame:any)=>{
    const link = document.createElement('a')
    link.href = frame.url
    link.download = generateRandomFileName('jpg', `frame-${frame.id + 1}-`)
    link.click()
  }

  const downloadAllAsZip=async()=>{
    if(extractedFrames.length===0){
      toast.error('No frames to download')
      return
    }
    
    try {
      setIsProcessing(true)
      setProgress(0)
      
      const zip = new JSZip()
      const folderName = `video-frames-${Date.now()}`
      const folder = zip.folder(folderName)
      
      // Add all frames to zip
      for (let i = 0; i < extractedFrames.length; i++) {
        const frame = extractedFrames[i]
        const fileName = `frame-${(i + 1).toString().padStart(4, '0')}.jpg`
        
        // Convert blob to array buffer
        const arrayBuffer = await frame.blob.arrayBuffer()
        folder?.file(fileName, arrayBuffer)
        
        // Update progress
        setProgress((i + 1) / extractedFrames.length * 90)
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      setProgress(100)
      
      // Download ZIP file
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = generateRandomFileName('zip', 'video-frames-')
      link.click()
      
      // Clean up
      URL.revokeObjectURL(link.href)
      
      toast.success(`Successfully created ZIP with ${extractedFrames.length} frames`)
      
    } catch (error) {
      console.error('ZIP creation error:', error)
      toast.error('Failed to create ZIP file')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  useEffect(()=>{
    return()=>{
      extractedFrames.forEach(f=>{if(f.url) URL.revokeObjectURL(f.url)})
    }
  },[extractedFrames])

  return(
    <div className="video-to-jpg space-y-6">
      <h2 className="text-center">VIDEO TO JPG</h2>
      <FileUploader onSelect={handleFileSelect} accept="video/*"/>
      {!isFFmpegLoaded&&(
        <div className="loading-section">
          <p>🔄 Loading video processor...</p>
          <p>This may take a few seconds on first load.</p>
        </div>
      )}
      {videoFile&&(
        <div className="settings-section rounded-xl">
          <h3>Settings</h3>
          <div className="setting-group">
            <label>Number of frames to extract: {frameCount}</label>
            <input type="range" min="0" max={frameOptions.length-1} value={frameOptions.indexOf(frameCount)} onChange={e=>setFrameCount(frameOptions[parseInt(e.target.value)])} className="w-full"/>
            <div className="slider-labels"><span>5</span><span>500</span></div>
          </div>
          <p className="quality-note">Quality: Always best (maximum quality)</p>
        </div>
      )}
      {videoFile&&(
        <div className="space-y-4">
          <button onClick={extractFrames} disabled={isProcessing||!isFFmpegLoaded||!videoFile} className="w-full px-6 py-3 text-lg font-bold uppercase tracking-wide text-primary-foreground bg-primary border-[3px] border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:shadow-[6px_6px_0_hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[2px_2px_0_hsl(var(--foreground))] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-[transform,box-shadow,background-color] duration-150">
            {!isFFmpegLoaded?'Loading processor...':isProcessing?`Processing... ${progress}%`:`Extract ${frameCount} Frames`}
          </button>
          {isProcessing&&<ProgressBar value={progress}/>}
        </div>
      )}
      {extractedFrames.length>0&&(
        <div className="results-section space-y-4">
          <div className="results-header flex justify-between items-center">
            <h3>Extracted {extractedFrames.length} Frames</h3>
            <button onClick={downloadAllAsZip} disabled={isProcessing} className="zip-btn">
              {isProcessing ? `📦 Creating ZIP... ${progress}%` : '📦 Download All as ZIP'}
            </button>
          </div>
          <div className="frames-grid">
            {extractedFrames.map((frame) => (
              <div key={frame.name} className="frame-card">
                <img src={frame.url} alt={frame.name}/>
                <button onClick={()=>downloadFrame(frame)}>Download</button>
              </div>
            ))}
          </div>
          <div className="bottom-zip-section">
            <button onClick={downloadAllAsZip} disabled={isProcessing} className="zip-btn large">
              {isProcessing ? `📦 Creating ZIP... ${progress}%` : `📦 Download All ${extractedFrames.length} Frames as ZIP`}
            </button>
            {isProcessing && <ProgressBar value={progress}/>}
          </div>
        </div>
      )}
    </div>
  )
}

