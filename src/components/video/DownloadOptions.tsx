
import { Button } from "@/components/ui/button";
import { Archive, DownloadCloud } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DownloadOptionsProps {
  gifCount: number;
  onDownloadZip: () => void;
  onDownloadAll: () => void;
  isCreatingZip: boolean;
  isDownloading: boolean;
}

const DownloadOptions = ({ 
  gifCount, 
  onDownloadZip, 
  onDownloadAll,
  isCreatingZip,
  isDownloading
}: DownloadOptionsProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex items-center justify-between mb-4">
      <h4 className="font-medium text-center">
        {t("convertedGifs")} ({gifCount})
      </h4>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onDownloadZip}
          disabled={isCreatingZip || isDownloading}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" />
          {isCreatingZip ? t("creatingZip") : t("downloadAsZIP")}
        </Button>
        <Button 
          variant="outline" 
          onClick={onDownloadAll}
          disabled={isDownloading || isCreatingZip}
          className="flex items-center gap-2"
        >
          <DownloadCloud className="h-4 w-4" />
          {isDownloading ? t("preparing") : t("downloadAll")}
        </Button>
      </div>
    </div>
  );
};

export default DownloadOptions;
