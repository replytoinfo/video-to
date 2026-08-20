
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useFFmpeg } from "@/contexts/FFmpegContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConversionButtonProps {
  onConvert: () => Promise<string[] | null>;
  disabled: boolean;
}

const ConversionButton = ({ onConvert, disabled }: ConversionButtonProps) => {
  const { isFFmpegLoaded } = useFFmpeg();
  const { t } = useLanguage();
  const [converting, setConverting] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  const handleConvert = async () => {
    if (!isFFmpegLoaded) {
      toast.error("FFmpeg is not loaded yet. Please wait or refresh the page.");
      return;
    }
    
    try {
      setConverting(true);
      const urls = await onConvert();
      
      if (urls && urls.length > 0) {
        setIsConverted(true);
        toast.success(`Conversion complete! Created ${urls.length} GIF file${urls.length > 1 ? 's' : ''}`);
      } else {
        toast.error("Conversion failed. Please try again.");
      }
      
      setConverting(false);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(`Failed to convert video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConverting(false);
    }
  };

  return (
    <Button
      onClick={handleConvert}
      disabled={disabled || converting}
      className="w-full"
    >
      {converting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("converting")}
        </>
      ) : isConverted ? (
        t("convertAgain")
      ) : (
        t("convertToGif")
      )}
    </Button>
  );
};

export default ConversionButton;
