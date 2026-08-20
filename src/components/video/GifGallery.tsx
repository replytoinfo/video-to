
import GifPreview from "./GifPreview";
import { useIsMobile } from "@/hooks/use-mobile";

interface GifGalleryProps {
  gifUrls: string[];
  onDownloadGif: (url: string, index: number) => void;
  gifSizes?: number[];
}

const GifGallery = ({ gifUrls, onDownloadGif, gifSizes = [] }: GifGalleryProps) => {
  const isMobile = useIsMobile();
  
  if (!gifUrls || gifUrls.length === 0) return null;
  
  return (
    <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-3 sm:gap-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto mt-3 sm:mt-4`}>
      {gifUrls.map((url, gifIndex) => (
        <GifPreview 
          key={gifIndex}
          url={url}
          index={gifIndex}
          onDownload={onDownloadGif}
          fileSize={gifSizes[gifIndex] || 0}
        />
      ))}
    </div>
  );
};

export default GifGallery;
