
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
// import { useIsMobile } from "@/hooks/use-mobile"; // TODO: Add mobile-specific UI

interface FFmpegErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
}

const FFmpegErrorMessage = ({ error, onRetry }: FFmpegErrorMessageProps) => {
  const { t } = useLanguage();
  // const isMobile = useIsMobile(); // TODO: Add mobile-specific UI
  
  // Default implementation if onRetry is not provided
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };
  
  if (!error) return null;
  
  const isSharedArrayBufferError = error.includes('SharedArrayBuffer');
  const isWebKitBlobError = error.includes('blob:') || error.includes('webkit') || error.includes('resource') || error.includes('Safari compatibility issue');
  const isSafariVersionError = error.includes('Safari') && error.includes('too old');
  const isTimeoutError = error.includes('timeout');
  const isBrowserCompatibilityError = isSharedArrayBufferError || error.includes('COOP') || error.includes('COEP') || isWebKitBlobError || isSafariVersionError;
  
  return (
    <div className="p-4 sm:p-5 bg-red-50 text-red-800 border border-red-200 rounded-md mb-6">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {t("ffmpegError")} {isBrowserCompatibilityError ? t("browserSecurityError") : error}
          </p>
          {isBrowserCompatibilityError && (
            <p className="text-xs ml-6 mt-1">
              {isWebKitBlobError 
                ? "This appears to be a Safari/WebKit issue. We've attempted multiple loading strategies including CDN fallbacks. Please try refreshing the page or use Chrome/Firefox for best experience."
                : isSafariVersionError
                ? "Your Safari version is too old. Please update to Safari 14+ or use Chrome/Firefox for video processing."
                : t("crossOriginIsolation")
              }
            </p>
          )}
          {isTimeoutError && (
            <p className="text-xs ml-6 mt-1">
              FFmpeg loading timed out. This may be due to slow internet connection or browser limitations. Please check your connection and try again.
            </p>
          )}
        </div>
        <Button 
          size="default"
          variant="outline" 
          className="text-red-800 border-red-300 text-sm mt-2 sm:mt-0"
          onClick={handleRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("retryLoading")}
        </Button>
      </div>
    </div>
  );
};

export default FFmpegErrorMessage;
