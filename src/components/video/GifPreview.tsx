import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { downloadSingleGif, downloadAllGifs, downloadAsZip } from "@/utils/downloadUtils";
import type { GifSettings } from "@/utils/videoToGif";

interface GifPreviewProps {
  gifUrls?: string[];
  url?: string;
  index?: number;
  videoFileName?: string;
  settings?: GifSettings;
  onDownload?: (url: string, index: number) => void;
  fileSize?: number;
}

const GifPreview = ({ 
  url, 
  index = 0, 
  onDownload, 
  gifUrls = [], 
  videoFileName = "video",
  settings = {},
  fileSize = 0 
}: GifPreviewProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const isLarge = fileSize > 100 * 1024 * 1024; // 100MB
  
  const handleDownloadSingle = (url: string, idx: number) => {
    downloadSingleGif(url, idx);
  };

  const handleDownloadAll = () => {
    if (gifUrls && gifUrls.length > 0) {
      downloadAsZip(gifUrls, setIsCreatingZip);
    }
  };

  const handleDownloadZip = () => {
    if (gifUrls && gifUrls.length > 0) {
      downloadAsZip(gifUrls, setIsCreatingZip);
    }
  };
  
  // If we have gifUrls array, render multiple GIFs
  if (gifUrls && gifUrls.length > 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium">{t("gifPreview")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {gifUrls.map((url, idx) => (
            <div key={idx} className="bg-background rounded-lg p-2 border overflow-hidden flex flex-col">
              <img 
                src={url} 
                alt={`${t("convertedGif")} ${idx + 1}`} 
                className="mx-auto max-h-36 sm:max-h-48 rounded object-contain"
              />
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"}
                  className="text-xs sm:text-sm w-full"
                  onClick={() => handleDownloadSingle(url, idx)}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {t("downloadSegment")} {idx + 1}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {gifUrls.length > 1 && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="default"
              onClick={handleDownloadAll}
              disabled={isDownloading || isCreatingZip}
              className="flex-1"
            >
              {isCreatingZip ? t("creatingZip") : t("downloadAll")}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadZip}
              disabled={isDownloading || isCreatingZip}
              className="flex-1"
            >
              {isCreatingZip ? t("creatingZip") : t("downloadAsZip")}
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Single GIF preview
  return (
    <div className="bg-background rounded-lg p-2 border overflow-hidden flex flex-col">
      <img 
        src={url} 
        alt={`${t("convertedGif")} ${index + 1}`} 
        className="mx-auto max-h-36 sm:max-h-48 rounded object-contain"
      />
      <div className="mt-2 flex flex-col gap-1">
        {fileSize > 0 && (
          <div className={`text-xs text-center ${isLarge ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
            {formatFileSize(fileSize)}
          </div>
        )}
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="text-xs sm:text-sm"
          onClick={() => onDownload?.(url || "", index)}
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          {t("downloadSegment")} {index + 1}
        </Button>
      </div>
    </div>
  );
};

export default GifPreview;
