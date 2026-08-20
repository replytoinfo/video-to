import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlayCircle, Scissors, Download, FileVideo, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFFmpeg } from "@/contexts/FFmpegContext";
import { GifSettings, convertVideoToGif } from "@/utils/videoToGif";
import { downloadAsZip } from "@/utils/downloadUtils";
import { useProgress } from "@/hooks/useProgress";
import DetailedProgress from "@/components/common/DetailedProgress";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SequentialConversionProps {
  videoFiles: File[];
}

type SegmentDuration = "5" | "10" | "custom";
type ConversionMode = "gif" | "video";

const SequentialConversion = ({ videoFiles }: SequentialConversionProps) => {
  const { t } = useLanguage();
  const { isFFmpegLoaded, ffmpeg } = useFFmpeg();
  const [segmentDuration, setSegmentDuration] = useState<SegmentDuration>("5");
  const [customDuration, setCustomDuration] = useState(7);
  const [isConverting, setIsConverting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [conversionMode, setConversionMode] = useState<ConversionMode>("gif");
  const [convertedUrls, setConvertedUrls] = useState<string[]>([]);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const progress = useProgress();
  
  // Get the actual segment duration in seconds
  const getActualDuration = (): number => {
    if (segmentDuration === "custom") {
      return customDuration;
    }
    return parseInt(segmentDuration);
  };
  
  const startSequentialConversion = async () => {
    if (!videoFiles.length || !isFFmpegLoaded || !ffmpeg) {
      toast.error(t("ffmpegNotLoaded"));
      return;
    }
    
    setIsConverting(true);
    setCurrentFileIndex(0);
    setConvertedUrls([]);
    
    // Setup progress tracking
    progress.reset();
    progress.show();
    
    // Add steps for overall process
    progress.addStep('init', 'Initializing sequential conversion');
    for (let i = 0; i < videoFiles.length; i++) {
      progress.addStep(`file-${i}`, `Processing ${videoFiles[i].name}`);
    }
    progress.addStep('complete', 'Completing conversion');
    
    progress.startStep('init', `Preparing to process ${videoFiles.length} video files...`);
    progress.completeStep('init');
    
    // Start with the first file
    await processNextFile(0, []);
  };
  
  const processNextFile = async (index: number, accumulatedUrls: string[]) => {
    if (index >= videoFiles.length) {
      // All files processed
      progress.startStep('complete', 'Finalizing conversion...');
      setIsConverting(false);
      setCurrentFileIndex(-1);
      
      progress.completeStep('complete', `Successfully processed ${videoFiles.length} videos with ${accumulatedUrls.length} segments`);
      
      toast.success(t("allVideosProcessed"), {
        description: `${accumulatedUrls.length} ${t("segmentsCreated")}`,
        duration: 5000
      });
      
      return;
    }
    
    const file = videoFiles[index];
    setCurrentFileIndex(index);
    
    try {
      progress.startStep(`file-${index}`, `Processing ${file.name} (${index + 1}/${videoFiles.length})`);
      toast.info(`${t("processing")} ${file.name} (${index + 1}/${videoFiles.length})`);
      
      // Create the GIF settings with segments based on the selected duration
      const settings: GifSettings = {
        quality: 10,
        fps: 30, // Increased from 24 to 30 for smoother GIFs
        width: 640, // Restored original width
        height: 0,
        maintainAspectRatio: true,
        speed: 1,
        // For segmentation, we use a special setting to split the video
        segments: 0, // This will be calculated in the conversion function
        segmentDuration: getActualDuration() // Custom property for fixed-time segments
      };
      
      // Convert the video to a GIF with progress tracking
      const urls = await convertVideoToGif(file, settings, ffmpeg, progress);
      
      if (urls && urls.length > 0) {
        const newUrls = [...accumulatedUrls, ...urls];
        setConvertedUrls(newUrls);
        
        progress.completeStep(`file-${index}`, `Generated ${urls.length} segments from ${file.name}`);
        
        // Wait 1 second before processing the next file
        setTimeout(() => {
          processNextFile(index + 1, newUrls);
        }, 1000);
      } else {
        progress.errorStep(`file-${index}`, `Failed to convert ${file.name}`);
        toast.error(`${t("failedToConvert")} ${file.name}`);
        
        // Continue with the next file anyway
        setTimeout(() => {
          processNextFile(index + 1, accumulatedUrls);
        }, 1000);
      }
    } catch (error) {
      console.error("Error converting file:", error);
      progress.errorStep(`file-${index}`, `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error(`${t("error")}: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      // Continue with the next file
      setTimeout(() => {
        processNextFile(index + 1, accumulatedUrls);
      }, 1000);
    }
  };
  
  const handleDownloadAll = async () => {
    if (convertedUrls.length === 0) {
      toast.error(t("noGifsToDownload"));
      return;
    }
    
    setIsCreatingZip(true);
    
    try {
      await downloadAsZip(convertedUrls, setIsCreatingZip);
    } catch (error) {
      console.error("Error downloading as ZIP:", error);
      toast.error(t("downloadError"));
      setIsCreatingZip(false);
    }
  };
  
  // Don't render anything if there are no video files
  if (videoFiles.length === 0) {
    return (
      <Card className="bg-secondary/30">
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px]">
          <FileVideo className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">{t("noFilesSelected")}</p>
          <p className="text-xs text-muted-foreground/70 text-center mt-2">
            {t("uploadFilesFirst")}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border rounded-lg p-4 mt-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg font-medium mb-1">{t("sequentialConversion")}</CardTitle>
        <CardDescription>{t("sequentialDescription")}</CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 pb-0">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-secondary/40 rounded-lg p-4">
            <div>
              <h4 className="font-medium mb-3">{t("segmentLength")}</h4>
              <RadioGroup 
                value={segmentDuration}
                onValueChange={(value) => setSegmentDuration(value as SegmentDuration)}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="r1" />
                  <Label htmlFor="r1">{t("5seconds")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="r2" />
                  <Label htmlFor="r2">{t("10seconds")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="r3" />
                  <Label htmlFor="r3">{t("customSeconds")}</Label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 7)}
                    disabled={segmentDuration !== "custom"}
                    className="w-16 h-8 rounded border px-2 text-sm"
                  />
                </div>
              </RadioGroup>
            </div>
            
            <div className="bg-background/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">{t("conversionStatus")}</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium">{t("filesToProcess")}</h5>
                    <p className="text-sm text-muted-foreground">
                      {videoFiles.length} {t("filesSelected")}
                    </p>
                  </div>
                </div>
                
                {currentFileIndex >= 0 && (
                  <div className="flex items-start gap-2">
                    <Scissors className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium">{t("currentlyProcessing")}</h5>
                      <p className="text-sm text-muted-foreground">
                        {videoFiles[currentFileIndex]?.name} ({currentFileIndex + 1}/{videoFiles.length})
                      </p>
                    </div>
                  </div>
                )}
                
                {convertedUrls.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileVideo className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium">{t("segmentsCreated")}</h5>
                      <p className="text-sm text-muted-foreground">{convertedUrls.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={startSequentialConversion}
              disabled={isConverting || !isFFmpegLoaded || videoFiles.length === 0}
              className="flex items-center gap-2"
            >
              {isConverting ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {isConverting ? t("processing") : t("startSequentialConversion")}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              disabled={convertedUrls.length === 0 || isConverting || isCreatingZip}
              className="flex items-center gap-2"
            >
              {isCreatingZip ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isCreatingZip ? t("creatingZip") : t("downloadAllAsZip")}
            </Button>
          </div>
        </div>
        
        <DetailedProgress
          title="Sequential Conversion Progress"
          steps={progress.steps}
          currentStep={progress.currentStep}
          overallProgress={progress.overallProgress}
          isVisible={progress.isVisible}
        />
      </CardContent>
    </Card>
  );
};

export default SequentialConversion;
