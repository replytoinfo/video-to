
import ConversionSettings from "@/components/ConversionSettings";
import ConversionButton from "@/components/ConversionButton";
import { GifSettings } from "@/utils/videoToGif";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface VideoSettingsProps {
  onSettingsChange: (settings: GifSettings) => void;
  onConvert: () => Promise<string[] | null>;
  disabled: boolean;
}

const VideoSettings = ({ onSettingsChange, onConvert, disabled }: VideoSettingsProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4 sm:space-y-5 p-2 bg-secondary/40 rounded-lg">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-semibold text-base sm:text-lg">{t("settings")}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-full hover:bg-muted p-1 transition-colors">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t("settingsHelpText")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ConversionSettings onSettingsChange={onSettingsChange} />
      </div>
      
      <div className="pt-2 sm:pt-4">
        <ConversionButton 
          onConvert={onConvert} 
          disabled={disabled} 
        />
      </div>
    </div>
  );
};

export default VideoSettings;
