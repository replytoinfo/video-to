
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { GifSettings } from "@/utils/videoToGif";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConversionSettingsProps {
  onSettingsChange: (settings: GifSettings) => void;
}

const ConversionSettings = ({ onSettingsChange }: ConversionSettingsProps) => {
  const { t } = useLanguage();
  
  const [settings, setSettings] = useState<GifSettings>({
    quality: 10,
    fps: 30,
    width: 480, // Restored original default width
    height: 0,
    maintainAspectRatio: true,
    speed: 1,
    segments: 1,
  });
  
  const [advancedSegmentMode, setAdvancedSegmentMode] = useState(false);

  const handleQualityChange = (value: number[]) => {
    const newSettings = { ...settings, quality: value[0] };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleFpsChange = (value: number[]) => {
    const newSettings = { ...settings, fps: value[0] };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value) || 0;
    const newSettings = { ...settings, width };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value) || 0;
    const newSettings = { ...settings, height };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleMaintainAspectRatioChange = (checked: boolean) => {
    const newSettings = { ...settings, maintainAspectRatio: checked };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSpeedChange = (value: number[]) => {
    const newSettings = { ...settings, speed: value[0] };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSegmentsChange = (value: number[]) => {
    const newSettings = { ...settings, segments: value[0] };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };


  const toggleAdvancedSegmentMode = () => {
    setAdvancedSegmentMode(prev => !prev);
    if (advancedSegmentMode && settings.segments > 20) {
      const newSettings = { ...settings, segments: 20 };
      setSettings(newSettings);
      onSettingsChange(newSettings);
    }
  };

  useEffect(() => {
    if (settings.maintainAspectRatio) {
      const newSettings = { ...settings, height: 0 };
      setSettings(newSettings);
      onSettingsChange(newSettings);
    }
  }, [settings.maintainAspectRatio]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="quality" className="text-base font-medium">
              {t("quality")} <span className="font-semibold ml-1">{settings.quality}</span>
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{t("qualityTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
            {settings.quality <= 3
              ? t("low")
              : settings.quality <= 7
              ? t("medium")
              : t("high")}
          </span>
        </div>
        <Slider
          id="quality"
          min={1}
          max={10}
          step={1}
          value={[settings.quality]}
          onValueChange={handleQualityChange}
          className="py-2"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="fps" className="text-base font-medium">
              {t("frameRate")} <span className="font-semibold ml-1">{settings.fps}</span> {t("fps")}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{t("fpsTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
            {settings.fps <= 10
              ? t("smooth")
              : settings.fps <= 20
              ? t("detailed")
              : t("highDetail")}
          </span>
        </div>
        <Slider
          id="fps"
          min={5}
          max={30}
          step={1}
          value={[settings.fps]}
          onValueChange={handleFpsChange}
          className="py-2"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="speed" className="text-base font-medium">
            {t("speed")} <span className="font-semibold ml-1">{settings.speed}x</span>
          </Label>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
            {settings.speed < 1
              ? t("slowMotion")
              : settings.speed === 1
              ? t("normal")
              : t("fast")}
          </span>
        </div>
        <Slider
          id="speed"
          min={0.25}
          max={2}
          step={0.25}
          value={[settings.speed]}
          onValueChange={handleSpeedChange}
          className="py-2"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label htmlFor="segments" className="text-base font-medium">
            {t("videoSegments")} <span className="font-semibold ml-1">{settings.segments}</span>
          </Label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleAdvancedSegmentMode} 
            className="h-8 px-3 text-xs"
          >
            {advancedSegmentMode ? (
              <>{t("standardMode")} <ChevronUp className="ml-1 h-3 w-3" /></>
            ) : (
              <>{t("advancedMode")} <ChevronDown className="ml-1 h-3 w-3" /></>
            )}
          </Button>
        </div>
        <Slider
          id="segments"
          min={1}
          max={advancedSegmentMode ? 60 : 20}
          step={1}
          value={[settings.segments]}
          onValueChange={handleSegmentsChange}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{settings.segments <= 1 ? t("noSplitting") : `${settings.segments} ${t("segments")}`}</span>
          <span>{advancedSegmentMode ? t("advancedUpTo") : t("standardUpTo")}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("dividesVideo")} <span className="font-medium">({settings.segments > 1 ? `${settings.segments} ${t("parts")}` : t("noParts")})</span>
          {advancedSegmentMode && settings.segments > 20 && (
            <span className="block mt-2 text-amber-500 font-medium">
              {t("warning")}
            </span>
          )}
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dimensions" className="text-base font-medium">
            {t("dimensions")}
          </Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="maintainAspectRatio"
              checked={settings.maintainAspectRatio}
              onCheckedChange={handleMaintainAspectRatioChange}
            />
            <Label htmlFor="maintainAspectRatio" className="text-sm">
              {t("maintainAspectRatio")}
            </Label>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="width" className="text-xs font-medium">
              {t("width")}
            </Label>
            <Input
              type="number"
              id="width"
              min={0}
              value={settings.width}
              onChange={handleWidthChange}
              className="h-10"
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="height" className="text-xs font-medium">
              {t("height")}
            </Label>
            <Input
              type="number"
              id="height"
              min={0}
              value={settings.maintainAspectRatio ? t("auto") : settings.height}
              onChange={handleHeightChange}
              className="h-10"
              disabled={settings.maintainAspectRatio}
            />
          </div>
        </div>
        {settings.maintainAspectRatio && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("heightWillBeCalculated")}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversionSettings;
