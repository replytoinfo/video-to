
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Clock } from "lucide-react";

interface FFmpegLoadingIndicatorProps {
  isLoading: boolean;
  progressValue?: number;
}

const FFmpegLoadingIndicator = ({ isLoading, progressValue = 75 }: FFmpegLoadingIndicatorProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [timeRemaining, setTimeRemaining] = useState(15); // Start with 15 seconds countdown
  
  useEffect(() => {
    if (!isLoading) return;
    
    // Reset timer when loading starts
    setTimeRemaining(15);
    
    // Set up countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isLoading]);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-md z-50">
      <div className="container max-w-screen-xl mx-auto p-3 sm:p-4 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("loadingFFmpeg")}
          </p>
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
            {timeRemaining} {t("seconds")}
          </span>
        </div>
        <Progress value={progressValue} className="h-1.5 sm:h-2" />
      </div>
    </div>
  );
};

export default FFmpegLoadingIndicator;
