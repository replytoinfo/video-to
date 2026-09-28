
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
      toast.error(t("ffmpegNotLoadedYet"));
      return;
    }

    try {
      setConverting(true);
      const urls = await onConvert();

      if (urls && urls.length > 0) {
        setIsConverted(true);
        toast.success(
          t(urls.length > 1 ? "gifConversionCompletePlural" : "gifConversionCompleteSingular").replace("{count}", String(urls.length))
        );
      } else {
        toast.error(t("conversionFailedRetry"));
      }

      setConverting(false);
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(t("failedToConvertVideoWithMessage").replace("{message}", error instanceof Error ? error.message : 'Unknown error'));
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
