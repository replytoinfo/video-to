import React, { useState, Suspense, lazy } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import VideoHeader from "@/components/video/VideoHeader";
import VideoUploader from "@/components/VideoUploader";
import VideoItem from "@/components/VideoItem";
import ConversionSettings from "@/components/ConversionSettings";
import ConversionButton from "@/components/ConversionButton";
import GifPreview from "@/components/video/GifPreview";
import FFmpegErrorMessage from "@/components/video/FFmpegErrorMessage";
import FFmpegLoadingIndicator from "@/components/video/FFmpegLoadingIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFFmpeg } from "@/contexts/FFmpegContext";
import { GifSettings, convertVideoToGif } from "@/utils/videoToGif";
import { toast } from "sonner";
import VideoCutter from "@/components/video/VideoCutter";
import ImgToJpgConverter from "@/components/converters/ImgToJpgConverter";
import { Loader2, Film, ImageIcon, Scissors, Sun, RefreshCw, Layers } from 'lucide-react'

// Lazy load heavy components
const VideoToJpgConverter = lazy(() => import('@/components/converters/VideoToJpgConverter'))
const MovToMp4 = lazy(() => import('@/components/converters/MovToMp4'))
const RemoveHDRConverter = lazy(() => import('@/components/RemoveHDRConverter'))
const SequentialConversion = lazy(() => import('@/components/video/SequentialConversion'))

// Loading component for lazy loaded components - NEOBRUTALISM
const LazyLoader = () => (
  <div className="flex items-center justify-center p-8 border-[3px] border-foreground bg-secondary shadow-[4px_4px_0_hsl(var(--foreground))]">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary border-[2px] border-foreground flex items-center justify-center brutal-loading">
        <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
      </div>
      <span className="font-bold uppercase tracking-wide">Loading converter...</span>
    </div>
  </div>
)

const Index = () => {
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [generatedGifs, setGeneratedGifs] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState("gif");
  const [gifSettings, setGifSettings] = useState<GifSettings>({
    quality: 10,
    fps: 30,
    width: 480,
    height: 0,
    maintainAspectRatio: true,
    speed: 1,
    segments: 1,
    segmentDuration: 0,
  });

  const { isFFmpegLoaded, isFFmpegLoading, ffmpegLoadingError, ffmpeg, loadFFmpeg, loadingProgress } = useFFmpeg();

  const handleVideosSelected = (files: File[]) => {
    setVideoFiles(prevFiles => {
      const existingNames = new Set(prevFiles.map(f => f.name));
      const newFiles = files.filter(file => !existingNames.has(file.name));

      return [...prevFiles, ...newFiles];
    });

    setGeneratedGifs([]);

    if (!isFFmpegLoaded && !isFFmpegLoading) {
      loadFFmpeg();
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideoFiles(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSettingsChange = (settings: GifSettings) => {
    setGifSettings(settings);
  };

  const handleConvert = async () => {
    if (!videoFiles.length || !ffmpeg) {
      toast.error("No videos to convert or FFmpeg not loaded.");
      return null;
    }

    try {
      setIsConverting(true);

      const firstVideo = videoFiles[0];
      toast.info(`Processing ${firstVideo.name}...`);

      const gifUrls = await convertVideoToGif(firstVideo, gifSettings, ffmpeg);

      if (gifUrls && gifUrls.length > 0) {
        setGeneratedGifs(gifUrls);
        toast.success(`Successfully converted to ${gifUrls.length} GIF(s)`);
      } else {
        toast.error("Conversion failed. Please try again.");
      }

      setIsConverting(false);
      return gifUrls;
    } catch (error) {
      toast.error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConverting(false);
      return null;
    }
  };

  const handleRetry = () => {
    if (ffmpegLoadingError) {
      loadFFmpeg();
    }
  };

  const displayFileName = videoFiles.length === 1 ? videoFiles[0].name : undefined;

  // Tabs configuration with icons - NEOBRUTALISM STYLE
  const tabs = [
    {
      value: "gif",
      title: "TO GIF",
      icon: <Film className="h-4 w-4" />,
      tooltip: "Convert video to animated GIF",
      color: "bg-primary"
    },
    {
      value: "mov",
      title: "MOV→MP4",
      icon: <RefreshCw className="h-4 w-4" />,
      tooltip: "Convert MOV files to MP4 format",
      color: "bg-[hsl(var(--neo-sky))]"
    },
    {
      value: "img",
      title: "IMG→JPG",
      icon: <ImageIcon className="h-4 w-4" />,
      tooltip: "Convert images to JPG format",
      color: "bg-[hsl(var(--neo-coral))]"
    },
    {
      value: "video-jpg",
      title: "VID→JPG",
      icon: <Layers className="h-4 w-4" />,
      tooltip: "Extract JPG frames from video",
      color: "bg-[hsl(var(--neo-lavender))]"
    },
    {
      value: "cut",
      title: "CUT",
      icon: <Scissors className="h-4 w-4" />,
      tooltip: "Cut video into segments",
      color: "bg-[hsl(var(--neo-lime))]"
    },
    {
      value: "remove-hdr",
      title: "NO HDR",
      icon: <Sun className="h-4 w-4" />,
      tooltip: "Remove HDR from video files",
      color: "bg-[hsl(var(--neo-orange))]"
    },
    {
      value: "sequential",
      title: "BATCH",
      icon: <Layers className="h-4 w-4" />,
      tooltip: "Convert multiple videos sequentially",
      color: "bg-[hsl(var(--neo-teal))]"
    }
  ];

  return (
    <div className="container py-4 sm:py-6 lg:py-8 max-w-screen-xl">
      <VideoHeader fileName={displayFileName} />

      {/* Tabs Component - NEOBRUTALISM STYLE */}
      <div className="mt-8 mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Navigation Panel */}
          <div className="mb-6">
            <TabsList className="flex flex-wrap justify-center gap-2 w-full p-3 bg-card" role="tablist" aria-label="Video conversion tools">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 px-4 py-3"
                  aria-label={tab.tooltip}
                  title={tab.tooltip}
                >
                  <span className={`w-6 h-6 flex items-center justify-center ${tab.color} border-[2px] border-foreground`}>
                    {tab.icon}
                  </span>
                  <span className="text-xs font-bold">{tab.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Content Area */}
          <TabsContent value="gif" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  {ffmpegLoadingError ? (
                    <FFmpegErrorMessage error={ffmpegLoadingError} onRetry={handleRetry} />
                  ) : (
                    <>
                      <VideoUploader onVideoSelected={handleVideosSelected} multiple={true} />

                      {videoFiles.length > 0 && (
                        <div className="mt-6 space-y-6">
                          {videoFiles.map((file, index) => (
                            <VideoItem
                              key={`${file.name}-${index}`}
                              index={index + 1}
                              videoFile={file}
                              onRemove={() => handleRemoveVideo(index)}
                            />
                          ))}

                          <div className="mt-6 space-y-4 p-6 border-[3px] border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground))]">
                            <h3 className="text-lg font-bold uppercase tracking-wide border-b-[3px] border-foreground pb-3 mb-4">
                              Conversion Settings
                            </h3>
                            <ConversionSettings onSettingsChange={handleSettingsChange} />
                            <ConversionButton
                              onConvert={handleConvert}
                              disabled={!isFFmpegLoaded || isConverting || videoFiles.length === 0}
                            />
                          </div>

                          {generatedGifs.length > 0 && (
                            <GifPreview
                              gifUrls={generatedGifs}
                            />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mov" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  <Suspense fallback={<LazyLoader />}>
                    <MovToMp4 />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="img" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  <Suspense fallback={<LazyLoader />}>
                    <ImgToJpgConverter key="img-converter" />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video-jpg" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  <Suspense fallback={<LazyLoader />}>
                    <VideoToJpgConverter />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="remove-hdr" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  <Suspense fallback={<LazyLoader />}>
                    <RemoveHDRConverter />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cut" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                <ErrorBoundary>
                  <Suspense fallback={<LazyLoader />}>
                    <VideoCutter />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sequential" className="mt-0">
            <div className="upload-section">
              <div className="pt-6 w-full upload-block">
                {ffmpegLoadingError ? (
                  <FFmpegErrorMessage error={ffmpegLoadingError} onRetry={handleRetry} />
                ) : (
                  <>
                    <VideoUploader onVideoSelected={handleVideosSelected} multiple={true} />
                    <Suspense fallback={<LazyLoader />}>
                      <SequentialConversion videoFiles={videoFiles} />
                    </Suspense>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FFmpegLoadingIndicator isLoading={isFFmpegLoading} progressValue={loadingProgress} />
    </div>
  );
};

export default Index;
