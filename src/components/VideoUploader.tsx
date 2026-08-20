import { useState, useRef } from "react";
import { Upload, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface VideoUploaderProps {
  onVideoSelected: (files: File[]) => void;
  multiple?: boolean;
}

const VideoUploader = ({ onVideoSelected, multiple = false }: VideoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(multiple ? Array.from(files) : [files[0]]);
    }
  };

  const handleFileSelection = (files: File[]) => {
    const videoFiles = files.filter(file => file.type.startsWith("video/"));

    if (videoFiles.length === 0) {
      toast.error("Please select valid video file(s)");
      return;
    }

    if (videoFiles.length < files.length) {
      toast.warning(`${files.length - videoFiles.length} non-video files were ignored`);
    }

    const largeFiles = videoFiles.filter(file => file.size > 500 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.info("Processing large files. Auto-resize will be applied for speed.");
    }

    onVideoSelected(videoFiles);

    if (videoFiles.length === 1) {
      toast.success("Video uploaded successfully");
    } else {
      toast.success(`${videoFiles.length} videos uploaded successfully`);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        id="videoInput"
        onChange={handleFileChange}
        accept="video/*"
        multiple={multiple}
        aria-label={multiple ? "Select multiple video files" : "Select a video file"}
      />

      <div
        className={cn(
          "p-8 transition-[transform,box-shadow,background-color] duration-150 text-center cursor-pointer relative border-[3px] border-dashed",
          isDragging
            ? "bg-primary border-foreground border-solid shadow-[6px_6px_0_hsl(var(--foreground))] -translate-x-1 -translate-y-1"
            : "bg-muted/40 border-primary hover:bg-muted/60",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop video files here or click to browse"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Icon container - NEOBRUTALISM */}
          <div className={cn(
            "w-20 h-20 flex items-center justify-center border-[3px] border-foreground shadow-[3px_3px_0_hsl(var(--foreground))] transition-[transform,background-color] duration-150",
            isDragging ? "bg-accent rotate-12" : "bg-primary"
          )}>
            {isDragging ? (
              <Film className="h-10 w-10 text-accent-foreground animate-pulse" />
            ) : (
              <Upload className="h-10 w-10 text-primary-foreground" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-xl uppercase tracking-wide">
              {isDragging ? t("dropIt") : t("uploadYourVideos")}
            </h3>
            <p className="text-muted-foreground text-sm mt-2 font-medium">
              {multiple ? t("dragDropMultiple") : t("dragDropSingle")}
            </p>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="mt-2"
            variant="outline"
            aria-label={multiple ? "Browse for multiple video files" : "Browse for video file"}
          >
            {t("browseFiles")}
          </Button>

          {/* Decorative corner marks */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-[3px] border-l-[3px] border-foreground opacity-50"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-[3px] border-r-[3px] border-foreground opacity-50"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-[3px] border-l-[3px] border-foreground opacity-50"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-[3px] border-r-[3px] border-foreground opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
