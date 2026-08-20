
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, FilmIcon, Zap } from "lucide-react";

interface VideoHeaderProps {
  index?: number;
  fileName?: string;
  onRemove?: () => void;
}

const VideoHeader = ({ index, fileName, onRemove }: VideoHeaderProps) => {
  const { t } = useLanguage();

  // Only show the simple header with filename when a file is provided
  if (fileName) {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground border-[3px] border-foreground border-b-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent border-[2px] border-foreground flex items-center justify-center">
            <FilmIcon className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-bold uppercase tracking-wide">
            {index && `${index}. `}{fileName}
          </span>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 border-[2px] border-foreground bg-background hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // For the main app header (when no file is selected) - NEOBRUTALISM STYLE
  return (
    <div className="mb-6 text-center relative">
      {/* Main Title with brutal styling */}
      <div className="relative inline-block">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-2 brutal-glitch">
          <span className="relative">
            VIDEO-TO
            <span className="absolute -bottom-2 left-0 w-full h-2 bg-accent"></span>
          </span>
          <span className="text-primary">.PRO</span>
        </h1>
      </div>

      <p className="text-foreground mt-4 text-sm max-w-2xl mx-auto font-medium">
        {t("applicationDescription")}
      </p>

      <div className="flex flex-col items-center justify-center mt-6 gap-3">
        {/* Info badges - NEOBRUTALISM */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(200,100%,15%,0.9)] text-[hsl(200,100%,85%)] border-[3px] border-[hsl(200,100%,60%)] shadow-[3px_3px_0_hsl(200,100%,60%)]">
          <Zap className="h-4 w-4 text-[hsl(200,100%,60%)]" />
          <p className="text-xs font-bold uppercase tracking-wide">
            {t("batchProcessingTip")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border-[3px] border-[hsl(0,90%,55%)] shadow-[3px_3px_0_hsl(0,90%,55%)]">
          <span className="text-lg text-[hsl(0,90%,60%)]">!!!</span>
          <p className="text-xs font-bold uppercase tracking-wide">
            {t("tabSwitchWarning")}
          </p>
        </div>

        <p className="text-xs text-muted-foreground font-medium mt-2">
          {t("privacyNotice")}. {t("fileNotStored")}.
        </p>
      </div>
    </div>
  );
};

export default VideoHeader;
