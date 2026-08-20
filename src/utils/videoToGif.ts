import { toast } from "sonner";
import { UseProgressReturn } from "@/hooks/useProgress";
import { 
  getSafariFFmpegLimits, 
  forceSafariMemoryCleanup, 
  safeFSOperation,
  isSafariBrowser 
} from "@/utils/browserUtils";


export interface GifSettings {
  quality: number;
  fps: number;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  speed: number;
  segments: number;
  segmentDuration?: number; // Optional: For fixed-time segments
}


// Helper function to convert any video format to MP4
const convertToMp4 = async (
  videoFile: File,
  ffmpegInstance: any,
  progress?: UseProgressReturn
): Promise<string> => {
  try {
    const { fetchFile } = await import("@ffmpeg/ffmpeg");
    
    // Get file extension
    const fileExtension = videoFile.name.split('.').pop()?.toLowerCase() || '';
    const inputFileName = `input.${fileExtension}`;
    const resizedFileName = "resized.mp4";
    const outputFileName = "converted.mp4";
    
    // Skip conversion for MP4 and MOV (try direct processing first)
    if (fileExtension === 'mp4' || fileExtension === 'mov') {
      console.log(`✅ File is ${fileExtension.toUpperCase()}, trying direct processing`);
      const inputFileData = await fetchFile(videoFile);
      ffmpegInstance.FS('writeFile', inputFileName, inputFileData);
      
      // For MOV files, try to use them directly without conversion
      if (fileExtension === 'mov') {
        console.log('🚀 Using MOV file directly for GIF conversion (skipping MP4 conversion)');
        return inputFileName; // Return original MOV file for direct GIF conversion
      }
      
      // For MP4, copy to standard output name
      ffmpegInstance.FS('writeFile', outputFileName, ffmpegInstance.FS('readFile', inputFileName));
      return outputFileName;
    }

    // Remove any leftover files from previous conversions (old API)
    try {
      ffmpegInstance.FS('unlink', inputFileName);
    } catch (_) {
      // Ignore if the file does not exist
    }
    try {
      ffmpegInstance.FS('unlink', outputFileName);
    } catch (_) {
      // Ignore if the file does not exist
    }
    
    console.log(`🎬 Converting ${fileExtension} to MP4...`);
    console.log('Input file size:', videoFile.size, 'bytes');
    console.log('Input file type:', videoFile.type);
    
    // Информация о размере файла для логирования
    console.log(`📊 File size: ${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`);
    toast.info(`Preparing video (${fileExtension} → MP4)...`);
    
    progress?.updateStep('convert', 10, `Writing ${fileExtension} file to memory...`);
    
    // Write the original file (old API)
    console.log('📁 Writing input file to FFmpeg filesystem...');
    const inputFileData = await fetchFile(videoFile);
    console.log('Input file data size:', inputFileData.length || inputFileData.byteLength || 'unknown');
    ffmpegInstance.FS('writeFile', inputFileName, inputFileData);
    console.log('✅ Input file written successfully to:', inputFileName);
    
    progress?.updateStep('convert', 50, `Converting ${fileExtension} to MP4 format...`);
    
    // Convert to MP4 with standard parameters
    console.log('🎬 STARTING FFMPEG EXEC COMMAND...');
    console.log('Input file written to FFmpeg FS:', inputFileName);
    
    console.log('⏳ Starting FFmpeg conversion...');
    
    // Try stream copy first (fastest), then fallback to re-encoding
    let workingCommand;
    
    // For MOV files, try stream copy first (no re-encoding)
    if (fileExtension === 'mov') {
      workingCommand = [
        "-y", 
        "-i", inputFileName,
        "-c:v", "copy", // Stream copy - no re-encoding!
        "-an", // Remove audio
        "-f", "mp4",
        outputFileName
      ];
      console.log('🚀 Trying stream copy (no re-encoding) for MOV file');
    } else {
      // For other formats, use fast encoding
      workingCommand = [
        "-y", 
        "-i", inputFileName,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-an",
        "-movflags", "+faststart",
        "-f", "mp4",
        outputFileName
      ];
    }
    console.log('ffmpeg command:', workingCommand.join(' '));
    
    try {
      await ffmpegInstance.run(...workingCommand);
      console.log('✅ Conversion succeeded');
    } catch (ffmpegError: any) {
      console.error('❌ FFmpeg conversion failed:', ffmpegError);
      
      // If stream copy failed for MOV, try re-encoding
      if (fileExtension === 'mov' && workingCommand.includes('copy')) {
        console.log('🔄 Stream copy failed, trying re-encoding for MOV file...');
        const fallbackCommand = [
          "-y", 
          "-i", inputFileName,
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-an",
          "-movflags", "+faststart",
          "-f", "mp4",
          outputFileName
        ];
        
        try {
          await ffmpegInstance.run(...fallbackCommand);
          console.log('✅ Fallback re-encoding succeeded');
        } catch (fallbackError) {
          console.error('❌ Fallback encoding also failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        // Проверяем на ошибку нехватки памяти
        if (ffmpegError?.message?.includes('OOM') || 
            ffmpegError?.message?.includes('abort') ||
            ffmpegError?.toString().includes('OOM')) {
          toast.error("Недостаточно памяти для обработки этого видео. Попробуйте файл меньшего размера или закройте другие вкладки браузера.");
          throw new Error("Out of memory during video processing");
        }
        
        throw ffmpegError;
      }
    }
    
    console.log('🎉 FFMPEG EXEC COMPLETED SUCCESSFULLY!');
    console.log('Conversion finished, checking output file...');
    
    // Check if output file exists (old API)
    try {
      const outputData = ffmpegInstance.FS('readFile', outputFileName);
      console.log('✅ Output MP4 file exists, size:', outputData.length, 'bytes');
    } catch (checkError) {
      console.error('❌ Output MP4 file not found:', checkError);
      throw new Error('FFmpeg conversion completed but output file not found');
    }
    
    progress?.updateStep('convert', 80, `Cleaning up temporary files...`);
    
    // Clean up original input file (old API)
    try {
      ffmpegInstance.FS('unlink', inputFileName);
    } catch (_) {
      // File might already be deleted
    }
    
    // Принудительная очистка памяти
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
    
    progress?.updateStep('convert', 100, `MP4 conversion completed successfully`);
    
    console.log("Video successfully converted to MP4");
    toast.success("Video prepared for GIF conversion");
    
    return outputFileName;
  } catch (error) {
    console.error("Error converting to MP4:", error);
    toast.error("Failed to prepare video for conversion");
    throw error;
  }
};

export const convertVideoToGif = async (
  videoFile: File,
  settings: GifSettings,
  ffmpegInstance: any,
  progress?: UseProgressReturn
): Promise<string[] | null> => {
  try {
    console.log('🚀 === STARTING VIDEO TO GIF CONVERSION ===');
    console.log('Video file:', videoFile.name, 'Size:', videoFile.size, 'Type:', videoFile.type);
    console.log('Settings:', settings);
    console.log('⚠️  IMPORTANT: This function processes segments sequentially to avoid ffmpeg.wasm concurrent execution errors');
    
    // Check if ffmpeg instance is provided
    if (!ffmpegInstance) {
      console.error("❌ FFmpeg instance is not available");
      toast.error("FFmpeg is not available. Please reload the page and try again.");
      return null;
    }
    
    // Memory management for long videos
    const videoSizeMB = videoFile.size / (1024 * 1024);
    const MAX_VIDEO_SIZE_MB = 1000; // Increased limit to 1GB
    const WARN_VIDEO_SIZE_MB = 500;
    
    if (videoSizeMB > MAX_VIDEO_SIZE_MB) {
      toast.error(`Video файл слишком большой (${videoSizeMB.toFixed(1)}MB). Максимальный размер: ${MAX_VIDEO_SIZE_MB}MB. Попробуйте сжать видео.`);
      return null;
    }
    
    if (videoSizeMB > WARN_VIDEO_SIZE_MB) {
      toast.info(`Большой файл (${videoSizeMB.toFixed(1)}MB). Обработка может занять несколько минут.`, {
        duration: 5000
      });
    }
    
    console.log("Starting conversion with FFmpeg instance:", ffmpegInstance);
    console.log("Conversion settings:", settings);
    

    
    // Standard conversion with FFmpeg
    // Dynamically import fetchFile
    const { fetchFile } = await import("@ffmpeg/ffmpeg");
    
    try {
      toast.info("Processing video...");
      console.log("Starting video processing pipeline...");
      
      progress?.show();
      progress?.addStep('prepare', 'Preparing video file');
      progress?.addStep('convert', 'Converting to MP4 (if needed)');
      progress?.addStep('metadata', 'Reading video metadata');
      progress?.addStep('segments', 'Creating GIF segments');
      progress?.addStep('cleanup', 'Cleaning up temporary files');
      
      progress?.startStep('prepare', 'Initializing video processing...');
      
      // STEP 1: Ensure we have an MP4 file in FFmpeg FS
      let mp4FileName: string;
      const fileExtension = videoFile.name.split('.').pop()?.toLowerCase() || '';
      
      if (fileExtension !== 'mp4') {
        progress?.completeStep('prepare');
        progress?.startStep('convert', `Converting ${fileExtension} to MP4...`);
        console.log(`🔄 Input format is ${fileExtension}, converting to MP4 first...`);
        console.log('⏳ About to call convertToMp4 function...');
        mp4FileName = await convertToMp4(videoFile, ffmpegInstance, progress);
        console.log(`✅ Conversion complete. MP4 file available as: ${mp4FileName}`);
        progress?.completeStep('convert', 'MP4 conversion completed');
        toast.info("Now processing converted MP4...");
      } else {
        progress?.updateStep('prepare', 50, 'Input is already MP4, writing to memory...');
        console.log("📝 Input is already MP4, writing directly to FFmpeg FS...");
        mp4FileName = "input.mp4";
        const inputData = await fetchFile(videoFile);
        console.log('📁 MP4 input data size:', inputData.length || inputData.byteLength || 'unknown');
        ffmpegInstance.FS('writeFile', mp4FileName, inputData);
        console.log('✅ MP4 file written to FFmpeg FS successfully');
        progress?.completeStep('prepare', 'MP4 file ready for processing');
        progress?.completeStep('convert', 'No conversion needed - already MP4');
      }
      
      // STEP 2: Get video metadata from the MP4 file
      progress?.startStep('metadata', 'Reading video metadata...');
      console.log(`Reading video metadata from MP4 file: ${mp4FileName}...`);
      
      // Get MP4 data for metadata calculation (old API)
      const mp4Data = ffmpegInstance.FS('readFile', mp4FileName);
      const mp4Blob = new Blob([mp4Data], { type: "video/mp4" });
      
      // Calculate the output dimensions using the MP4 blob
      const outputWidth = settings.width;
      let outputHeight = settings.height;
      
      if (settings.maintainAspectRatio && outputWidth > 0) {
        progress?.updateStep('metadata', 30, 'Calculating aspect ratio...');
        // Create a temporary video element with the MP4 blob
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(mp4Blob);
        
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            const aspectRatio = video.videoWidth / video.videoHeight;
            outputHeight = Math.round(outputWidth / aspectRatio);
            resolve();
          };
        });
      }
      
      // Get video duration for segmentation using the MP4 blob
      progress?.updateStep('metadata', 70, 'Reading video duration...');
      let videoDuration = 0;
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(mp4Blob);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(video.src);
          reject(new Error('Timeout reading video metadata'));
        }, 10000); // 10 second timeout
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoDuration = video.duration;
          URL.revokeObjectURL(video.src);
          resolve();
        };
        
        video.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(video.src);
          reject(new Error('Failed to load video metadata'));
        };
      });
      
      progress?.completeStep('metadata', `Video metadata ready: ${videoDuration.toFixed(1)}s duration, ${outputWidth}x${outputHeight}`);

      // STEP 3: Build the FFmpeg command for GIF conversion (using MP4 file)
      progress?.startStep('segments', 'Preparing GIF conversion...');
      const quality = 11 - settings.quality; // Invert quality (10 = best, 1 = worst)
      const fps = Math.round(settings.fps / settings.speed);
      const sizeFilter = outputHeight > 0 
        ? `scale=${outputWidth}:${outputHeight}` 
        : `scale=${outputWidth}:-1`;
      
      // Simplified: Use basic color correction for all videos (no HDR detection)
      const toneMappingFilter = 'eq=contrast=1.1:saturation=1.1,'; // Light color correction for all videos
      
      console.log('Video processing: applying basic color correction to all videos');
      
      console.log("FFmpeg conversion parameters for MP4 processing:", {
        inputFile: mp4FileName,
        quality,
        fps,
        sizeFilter,
        segments: settings.segments,
        segmentDuration: settings.segmentDuration,
        videoDuration
      });
      
      // Fixed-duration segmentation (new feature)
      if (settings.segmentDuration && settings.segmentDuration > 0) {
        // Calculate how many segments we'll need
        const segmentDuration = settings.segmentDuration;
        const rawEstimatedSegments = Math.ceil(videoDuration / segmentDuration);
        
        // Get Safari-specific limits
        const safariLimits = getSafariFFmpegLimits();
        const maxSegments = safariLimits.maxSegments;
        
        // Apply Safari-specific protection
        const estimatedSegments = Math.min(rawEstimatedSegments, maxSegments);
        
        if (rawEstimatedSegments > maxSegments) {
          const browserName = isSafariBrowser() ? 'Safari' : 'this browser';
          toast.error(`Слишком много сегментов (${rawEstimatedSegments}). Максимум для ${browserName}: ${maxSegments}. Увеличьте длительность сегмента.`);
          return null;
        }
        
        // Warning for many segments (Safari-specific)
        const warningThreshold = isSafariBrowser() ? 20 : 50;
        if (estimatedSegments > warningThreshold) {
          const browserName = isSafariBrowser() ? 'Safari' : 'this browser';
          toast.info(`Большое количество сегментов (${estimatedSegments}) в ${browserName}. Это может занять много времени.`, {
            duration: 5000
          });
        }
        
        // Create an array to hold all segment URLs
        const segmentUrls: string[] = [];
        
        // Show progress to user
        progress?.updateStep('segments', 10, `Creating ${estimatedSegments} segments of ${segmentDuration} seconds each...`);
        toast.info(`Creating ${estimatedSegments} segments of ${segmentDuration} seconds each from MP4...`);
        
        // Process each segment sequentially with Safari optimizations
        const filesToCleanup: string[] = [];
        
        // ВАЖНО: Обрабатываем сегменты строго по очереди, не параллельно
        for (let i = 0; i < estimatedSegments; i++) {
          const startTime = i * segmentDuration;
          
          // If this segment would go past the end of the video, skip it
          if (startTime >= videoDuration) {
            break;
          }
          
          console.log(`🔄 Sequential processing: Starting segment ${i+1}/${estimatedSegments}`);
          console.log(`📊 Progress: ${((i / estimatedSegments) * 100).toFixed(1)}% complete`);
          
          // Calculate actual duration for this segment (might be shorter for the last segment)
          const actualDuration = Math.min(segmentDuration, videoDuration - startTime);
          const outputFilename = `segment_${i}.gif`;
          
          // Update progress
          const segmentProgress = 20 + (i / estimatedSegments) * 70; // 20% to 90%
          progress?.updateStep('segments', segmentProgress, `Processing segment ${i+1}/${estimatedSegments} (${startTime.toFixed(1)}s-${(startTime+actualDuration).toFixed(1)}s)`);
          
          toast.info(`Processing MP4 segment ${i+1} of ${estimatedSegments}...`, {
            id: "segment-progress"
          });
          
          console.log(`Processing MP4 segment ${i+1}/${estimatedSegments} (${startTime}s to ${startTime+actualDuration}s) from ${mp4FileName}`);
          
          let retryCount = 0;
          const maxRetries = safariLimits.maxRetries;
          
          // ВАЖНО: Обрабатываем каждый сегмент строго последовательно
          while (retryCount <= maxRetries) {
            try {
              // Clean up any existing output file first with safe operation
              await safeFSOperation(
                () => ffmpegInstance.FS('unlink', outputFilename),
                safariLimits.operationTimeout,
                0
              ).catch(() => {
                // File doesn't exist, that's fine
              });
              
              // Run FFmpeg to create the segment GIF - using MP4 file
              const segmentCommand = [
                "-ss", startTime.toString(),
                "-t", actualDuration.toString(),
                "-i", mp4FileName,
                "-vf", `${toneMappingFilter}fps=${fps},${sizeFilter}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle`,
                "-loop", "0",
                "-y", // Overwrite output files without asking
                outputFilename
              ];
              
              // ИСПРАВЛЕНО: Убираем Promise.race для избежания конкурентного выполнения
              // Выполняем команду строго последовательно
              console.log(`Executing FFmpeg command for segment ${i+1}: ${segmentCommand.join(' ')}`);
              await ffmpegInstance.run(...segmentCommand);
              
              console.log(`MP4 segment ${i+1} conversion completed`);
              
              // Read the segment GIF data with safe operation
              const segmentData = await safeFSOperation(
                () => ffmpegInstance.FS('readFile', outputFilename),
                safariLimits.operationTimeout,
                0
              );
              
              // Create a URL for this segment
              const gifBlob = new Blob([segmentData], { type: "image/gif" });
              const url = URL.createObjectURL(gifBlob);
              segmentUrls.push(url);
              
              // Add to cleanup list instead of immediate cleanup
              filesToCleanup.push(outputFilename);
              
              // Break out of retry loop on success
              break;
              
            } catch (segmentError) {
              retryCount++;
              console.error(`Error processing MP4 segment ${i+1} (attempt ${retryCount}):`, segmentError);
              
              if (retryCount > maxRetries) {
                toast.error(`Failed to convert MP4 segment ${i+1}: ${segmentError instanceof Error ? segmentError.message : 'Unknown error'}`);
                break;
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Safari-specific memory cleanup every N segments
          if (i % safariLimits.memoryCleanupInterval === 0) {
            await forceSafariMemoryCleanup();
            
            // Batch cleanup files
            for (const filename of filesToCleanup) {
              await safeFSOperation(
                () => ffmpegInstance.FS('unlink', filename),
                safariLimits.operationTimeout,
                0
              ).catch(() => {
                // File might already be deleted
              });
            }
            filesToCleanup.length = 0;
          }
          
          // Add Safari-specific delay between segments
          if (safariLimits.fsOperationDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, safariLimits.fsOperationDelay));
          }
        }
        
        // Final cleanup of remaining files
        for (const filename of filesToCleanup) {
          await safeFSOperation(
            () => ffmpegInstance.FS('unlink', filename),
            safariLimits.operationTimeout,
            0
          ).catch(() => {
            // File might already be deleted
          });
        }
        
        progress?.completeStep('segments', `Generated ${segmentUrls.length} GIF segments successfully`);
        progress?.startStep('cleanup', 'Cleaning up temporary files...');
        
        // Clean up input file (MP4) (old API)
        try {
          ffmpegInstance.FS('unlink', mp4FileName);
        } catch (_) {
          // File might already be deleted
        }
        
        progress?.completeStep('cleanup', 'All temporary files cleaned up');
        
        return segmentUrls;
      }
      // If segments > 1, we need to cut the video into even pieces
      else if (settings.segments > 1 && videoDuration > 0) {
        const segmentUrls: string[] = [];
        const segmentDuration = videoDuration / settings.segments;
        
        toast.info(`Creating ${settings.segments} equal segments from MP4...`);
        
        // ВАЖНО: Обрабатываем равные сегменты строго по очереди
        for (let i = 0; i < settings.segments; i++) {
          const startTime = i * segmentDuration;
          const outputFilename = `segment_${i}.gif`;
          
          // Update progress
          toast.info(`Processing MP4 segment ${i+1} of ${settings.segments}...`, {
            id: "segment-progress"
          });
          
          console.log(`Processing equal MP4 segment ${i+1}/${settings.segments} (${startTime}s to ${startTime+segmentDuration}s) from ${mp4FileName}`);
          
          try {
            // Clean up any existing output file first
            try {
              ffmpegInstance.FS('unlink', outputFilename);
            } catch (_) {
              // File doesn't exist, that's fine
            }
            
            // Run FFmpeg command for this segment using MP4
            const equalSegmentCommand = [
              "-ss", startTime.toString(),
              "-t", segmentDuration.toString(),
              "-i", mp4FileName,
              "-vf", `${toneMappingFilter}fps=${fps},${sizeFilter}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle`,
              "-loop", "0",
              "-y", // Overwrite output files without asking
              outputFilename
            ];
            
            // ИСПРАВЛЕНО: Добавляем логирование для отслеживания последовательности
            console.log(`Executing FFmpeg command for equal segment ${i+1}: ${equalSegmentCommand.join(' ')}`);
            await ffmpegInstance.run(...equalSegmentCommand);
            
            console.log(`Equal MP4 segment ${i+1} conversion completed`);
            
            // Read the segment GIF data (old API)
            const segmentData = ffmpegInstance.FS('readFile', outputFilename);
            
            // Create a URL for this segment
            const gifBlob = new Blob([segmentData], { type: "image/gif" });
            const url = URL.createObjectURL(gifBlob);
            segmentUrls.push(url);
            
            // Clean up this segment file (old API)
            try {
              ffmpegInstance.FS('unlink', outputFilename);
            } catch (_) {
              // File might already be deleted
            }
          } catch (segmentError) {
            console.error(`Error processing equal MP4 segment ${i+1}:`, segmentError);
            toast.error(`Failed to convert equal MP4 segment ${i+1}: ${segmentError instanceof Error ? segmentError.message : 'Unknown error'}`);
          }
        }
        
        // Clean up input file (MP4) (old API)
        try {
          ffmpegInstance.FS('unlink', mp4FileName);
        } catch (_) {
          // File might already be deleted
        }
        
        return segmentUrls;
      } else {
        // Single segment conversion
        console.log(`Running single segment conversion from MP4 file: ${mp4FileName}...`);
        toast.info("Creating GIF from MP4...");
        
        // Improved command with more stable parameters and explicit format using MP4
        const singleGifCommand = [
          "-i", mp4FileName,
          "-vf", `${toneMappingFilter}fps=${fps},${sizeFilter}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg:diff_mode=rectangle`,
          "-loop", "0",
          "output.gif"
        ];
        
        // Execute single GIF conversion (old API)
        await ffmpegInstance.run(...singleGifCommand);
        
        console.log("FFmpeg run completed, reading result...");
        // Read the result (old API)
        const data = ffmpegInstance.FS('readFile', "output.gif");
        
        // Clean up (MP4 file) (old API)
        try {
          ffmpegInstance.FS('unlink', mp4FileName);
          ffmpegInstance.FS('unlink', "output.gif");
        } catch (_) {
          // Files might already be deleted
        }
        
        // Create a URL
        const gifBlob = new Blob([data], { type: "image/gif" });
        const url = URL.createObjectURL(gifBlob);
        console.log("GIF created from MP4, URL:", url.slice(0, 30) + "...");
        return [url];
      }
    } catch (error) {
      console.error("Error during MP4 processing:", error);
      toast.error(`MP4 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  } catch (importError) {
    console.error("Error importing FFmpeg:", importError);
    toast.error("Failed to load FFmpeg. Please try again or check your internet connection.");
    return null;
  }
};
