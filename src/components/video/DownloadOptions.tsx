
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h4 className="font-medium text-center">
        {t("convertedGifs")} ({gifCount})
      </h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onDownloadZip}
          disabled={isCreatingZip || isDownloading}
          className="flex items-center gap-2 flex-1 sm:flex-none min-w-0"
        >
          <Archive className="h-4 w-4 shrink-0" />
          <span className="truncate">{isCreatingZip ? t("creatingZip") : t("downloadAsZIP")}</span>
        </Button>
        <Button
          variant="outline"
          onClick={onDownloadAll}
          disabled={isDownloading || isCreatingZip}
          className="flex items-center gap-2 flex-1 sm:flex-none min-w-0"
        >
          <DownloadCloud className="h-4 w-4 shrink-0" />
          <span className="truncate">{isDownloading ? t("preparing") : t("downloadAll")}</span>
        </Button>
      </div>
    </div>
  );
};

export default DownloadOptions;
