import { toast } from "sonner";

// Helper function to get video dimensions
export const getVideoDimensions = async (
  videoFile: File
): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(videoFile);
    
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Timeout reading video metadata'));
    }, 10000);
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const dimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      };
      URL.revokeObjectURL(video.src);
      resolve(dimensions);
    };
    
    video.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
  });
};

// Helper function to calculate target resolution based on orientation
export const calculateTargetResolution = (width: number, height: number) => {
  const isVertical = height > width;
  
  if (isVertical) {
    // Vertical video: 640x1138
    return { width: 640, height: 1138 };
  } else {
    // Horizontal video: 1138x640
    return { width: 1138, height: 640 };
  }
};

// Helper function to check if video needs resizing
export const needsResizing = (width: number, height: number): boolean => {
  const targetRes = calculateTargetResolution(width, height);
  return width > targetRes.width || height > targetRes.height;
};

// Helper function to resize video using FFmpeg
export const resizeVideo = async (
  ffmpegInstance: any,
  inputFileName: string,
  outputFileName: string,
  targetWidth: number,
  targetHeight: number,
  preset: 'fast' | 'medium' | 'slow' = 'medium'
): Promise<void> => {
  const resizeCommand = [
    "-y",
    "-i", inputFileName,
    "-vf", `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:-1:-1:black`,
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-an", // Remove audio to reduce size
    "-movflags", "+faststart",
    "-f", "mp4",
    outputFileName
  ];
  
  console.log('📏 Resize command:', resizeCommand.join(' '));
  await ffmpegInstance.run(...resizeCommand);
};

// Main function to handle video resizing workflow
export const processVideoWithResizing = async (
  videoFile: File,
  ffmpegInstance: any,
  onProgress?: (step: string, progress: number) => void
): Promise<{
  fileName: string;
  needsResize: boolean;
  originalDimensions: { width: number; height: number };
  targetDimensions: { width: number; height: number };
}> => {
  // Get video dimensions
  onProgress?.('Analyzing video dimensions...', 10);
  console.log('📊 Reading video dimensions for resize analysis...');
  
  let videoDimensions;
  try {
    videoDimensions = await getVideoDimensions(videoFile);
    console.log(`📐 Original video dimensions: ${videoDimensions.width}x${videoDimensions.height}`);
  } catch (error) {
    console.error('❌ Failed to get video dimensions:', error);
    toast.error("Не удалось получить информацию о видео");
    throw error;
  }
  
  // Calculate target resolution
  const targetRes = calculateTargetResolution(videoDimensions.width, videoDimensions.height);
  const shouldResize = needsResizing(videoDimensions.width, videoDimensions.height);
  
  console.log(`🎯 Target resolution: ${targetRes.width}x${targetRes.height}`);
  console.log(`🔄 Resize needed: ${shouldResize ? 'YES' : 'NO'}`);
  
  if (shouldResize) {
    toast.info(`Изменение размера видео: ${videoDimensions.width}x${videoDimensions.height} → ${targetRes.width}x${targetRes.height}`);
  }

  const fileExtension = videoFile.name.split('.').pop()?.toLowerCase() || '';
  const inputFileName = `input.${fileExtension}`;
  const resizedFileName = "resized.mp4";
  
  // Write input file to FFmpeg filesystem
  onProgress?.('Writing video to memory...', 20);
  console.log('📁 Writing input file to FFmpeg filesystem...');
  const { fetchFile } = await import("@ffmpeg/ffmpeg");
  const inputFileData = await fetchFile(videoFile);
  ffmpegInstance.FS('writeFile', inputFileName, inputFileData);
  
  let finalFileName = inputFileName;
  
  // Resize if needed
  if (shouldResize) {
    onProgress?.('Resizing video...', 50);
    console.log('🔄 Resizing video to target resolution...');
    console.log(`Resizing from ${videoDimensions.width}x${videoDimensions.height} to ${targetRes.width}x${targetRes.height}`);
    
    // Clean up any existing output file
    try {
      ffmpegInstance.FS('unlink', resizedFileName);
    } catch (_) {
      // Ignore if file doesn't exist
    }
    
    try {
      await resizeVideo(
        ffmpegInstance, 
        inputFileName, 
        resizedFileName, 
        targetRes.width, 
        targetRes.height
      );
      
      console.log('✅ Video resized successfully');
      finalFileName = resizedFileName;
      
      // Update file size info
      const resizedData = ffmpegInstance.FS('readFile', resizedFileName);
      console.log(`📊 Resized file size: ${(resizedData.length / (1024 * 1024)).toFixed(2)} MB`);
      toast.success(`Видео изменено до ${targetRes.width}x${targetRes.height}. Размер уменьшен до ${(resizedData.length / (1024 * 1024)).toFixed(1)} MB`);
      
      onProgress?.('Video resized successfully', 80);
    } catch (resizeError: any) {
      console.error('❌ Video resize failed:', resizeError);
      toast.error("Не удалось изменить размер видео");
      throw resizeError;
    }
  }
  
  onProgress?.('Processing complete', 100);
  
  return {
    fileName: finalFileName,
    needsResize: shouldResize,
    originalDimensions: { 
      width: videoDimensions.width, 
      height: videoDimensions.height 
    },
    targetDimensions: targetRes
  };
};

// Cleanup function to remove temporary files
export const cleanupResizeFiles = (
  ffmpegInstance: any, 
  inputFileName: string, 
  resizedFileName?: string
): void => {
  try {
    ffmpegInstance.FS('unlink', inputFileName);
  } catch (_) {
    // File might already be deleted
  }
  
  if (resizedFileName) {
    try {
      ffmpegInstance.FS('unlink', resizedFileName);
    } catch (_) {
      // File might already be deleted
    }
  }
};