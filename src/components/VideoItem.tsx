import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trash2, Download, FileVideo, AlertTriangle } from 'lucide-react'
import { useFFmpeg } from '@/contexts/FFmpegContext'
import { GifSettings, convertVideoToGif } from '@/utils/videoToGif'
import { downloadSingleGif, downloadAllGifs, downloadAsZip } from '@/utils/downloadUtils'
import { toast } from 'sonner'
import GifPreview from '@/components/video/GifPreview'
import ConversionSettings from '@/components/ConversionSettings'
import ConversionButton from '@/components/ConversionButton'
import { useLanguage } from '@/contexts/LanguageContext'
import VideoPreview from '@/components/VideoPreview'
// import { useIsMobile } from '@/hooks/use-mobile' // TODO: Add mobile support

// Import our components
import VideoHeader from "@/components/video/VideoHeader";
import FFmpegLoadingIndicator from "@/components/video/FFmpegLoadingIndicator";
import FFmpegErrorMessage from "@/components/video/FFmpegErrorMessage";
import VideoSettings from "@/components/video/VideoSettings";
import DownloadOptions from "@/components/video/DownloadOptions";
import GifGallery from "@/components/video/GifGallery";

// Size constants (in bytes)
const SIZE_100MB = 100 * 1024 * 1024;

interface VideoItemProps {
  videoFile: File
  index: number
  onRemove: () => void
}

const VideoItem = React.memo(({ videoFile, index, onRemove }: VideoItemProps) => {
  const { isFFmpegLoaded, isFFmpegLoading, ffmpegLoadingError, ffmpeg, loadFFmpeg } = useFFmpeg();
  const { t } = useLanguage();
  // const isMobile = useIsMobile(); // TODO: Add mobile-specific UI
  
  const [settings, setSettings] = useState<GifSettings>({
    quality: 10, // Increased from 7 to 10 for better quality
    fps: 30, // Increased from 10 to 30 for smoother results
    width: 480, // Restored original default width
    height: 0,
    maintainAspectRatio: true,
    speed: 1,
    segments: 1,
    segmentDuration: 0, // No fixed-time segments by default
  });
  
  const [convertedGifUrls, setConvertedGifUrls] = useState<string[] | null>(null);
  const [isConverting, setIsConverting] = useState(false); // TODO: Use for UI state management
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [gifSizes, setGifSizes] = useState<number[]>([]);
  const [hasLargeGifs, setHasLargeGifs] = useState(false);

  const handleSettingsChange = (newSettings: GifSettings) => {
    setSettings(newSettings);
  };

  const handleConvert = async () => {
    if (!isFFmpegLoaded || !ffmpeg) {
      toast.error("FFmpeg is not loaded yet. Please wait or try reloading FFmpeg.");
      return null;
    }
    
    try {
      setIsConverting(true);
      
      // Sequential processing for single video
      toast.info(`Processing ${videoFile.name}...`);
      
      const gifUrls = await convertVideoToGif(videoFile, settings, ffmpeg);
      setIsConverting(false);
      
      if (gifUrls && gifUrls.length > 0) {
        setConvertedGifUrls(gifUrls);
        toast.success(`Successfully converted to ${gifUrls.length} GIF(s)`);
        
        // Calculate sizes of GIFs
        calculateGifSizes(gifUrls);
        return gifUrls;
      } else {
        toast.error("Failed to convert video to GIF");
        return null;
      }
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert video to GIF");
      setIsConverting(false);
      return null;
    }
  };
  
  const calculateGifSizes = async (urls: string[]) => {
    try {
      const sizePromises = urls.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return blob.size;
      });
      
      const sizes = await Promise.all(sizePromises);
      setGifSizes(sizes);
      
      // Check if any GIF is larger than 100MB
      const hasLarge = sizes.some(size => size > SIZE_100MB);
      setHasLargeGifs(hasLarge);
      
      if (hasLarge) {
        displaySizeWarning(sizes);
      }
    } catch (error) {
      console.error("Error calculating GIF sizes:", error);
    }
  };
  
  const displaySizeWarning = (sizes: number[]) => {
    const largeGifCount = sizes.filter(size => size > SIZE_100MB).length;
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const totalSizeMB = Math.round(totalSize / (1024 * 1024));
    
    toast.warning(
      t("largeGifWarning"),
      {
        description: `${largeGifCount} ${t("gifsTooLarge")} (${totalSizeMB} MB). ${t("sizeWarningDescription")}`,
        icon: <AlertTriangle className="h-4 w-4" />,
        duration: 10000
      }
    );
  };

  const handleRetryFFmpegLoading = () => {
    loadFFmpeg();
  };

  const handleDownloadGif = (url: string, index: number) => {
    downloadSingleGif(url, index);
  };

  const handleDownloadAllGifs = () => {
    if (!convertedGifUrls) return;
    downloadAsZip(convertedGifUrls, setIsCreatingZip);
  };

  const handleDownloadAsZip = async () => {
    if (!convertedGifUrls) return;
    await downloadAsZip(convertedGifUrls, setIsCreatingZip);
  };

  return (
    <div className="border rounded-lg shadow-sm mb-6 overflow-hidden">
      <VideoHeader 
        index={index} 
        fileName={videoFile.name} 
        onRemove={onRemove} 
      />
      
      <FFmpegLoadingIndicator isLoading={isFFmpegLoading} />
      
      <FFmpegErrorMessage 
        error={ffmpegLoadingError} 
        onRetry={handleRetryFFmpegLoading} 
      />
      
      <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 sm:p-4">
        <div>
          <h4 className="font-medium mb-2 text-sm sm:text-base">{t("preview")}</h4>
          <VideoPreview videoFile={videoFile} />
        </div>
        
        <VideoSettings 
          onSettingsChange={handleSettingsChange}
          onConvert={handleConvert}
          disabled={!videoFile || isFFmpegLoading || !isFFmpegLoaded}
        />
      </CardContent>
      
      {convertedGifUrls && convertedGifUrls.length > 0 && (
        <div className="p-3 sm:p-4 border-t">
          {hasLargeGifs && (
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-amber-800">{t("largeGifWarning")}</p>
                <p className="text-xs text-amber-700 mt-1">{t("sizeWarningDescription")}</p>
              </div>
            </div>
          )}
          
          <DownloadOptions 
            gifCount={convertedGifUrls.length}
            onDownloadZip={handleDownloadAsZip}
            onDownloadAll={handleDownloadAllGifs}
            isCreatingZip={isCreatingZip}
            isDownloading={isDownloading}
          />
          
          <GifGallery 
            gifUrls={convertedGifUrls} 
            onDownloadGif={handleDownloadGif} 
            gifSizes={gifSizes}
          />
        </div>
      )}
    </div>
  );
});

export default VideoItem;
