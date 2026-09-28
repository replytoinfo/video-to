
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
      <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto sm:flex-wrap">
        <Button
          variant="outline"
          onClick={onDownloadZip}
          disabled={isCreatingZip || isDownloading}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Archive className="h-4 w-4 shrink-0" />
          <span>{isCreatingZip ? t("creatingZip") : t("downloadAsZIP")}</span>
        </Button>
        <Button
          variant="outline"
          onClick={onDownloadAll}
          disabled={isDownloading || isCreatingZip}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <DownloadCloud className="h-4 w-4 shrink-0" />
          <span>{isDownloading ? t("preparing") : t("downloadAll")}</span>
        </Button>
      </div>
    </div>
  );
};

export default DownloadOptions;
