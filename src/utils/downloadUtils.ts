import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

/**
 * Generates a random filename with specified extension
 * @param extension File extension (without dot)
 * @param prefix Optional prefix for the filename
 * @returns Random filename like "abc123def456.gif"
 */
export const generateRandomFileName = (extension: string, prefix: string = ""): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8; // 8 characters for random part
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  const randomPart = result;
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string
  
  return `${prefix}${randomPart}${timestamp}.${extension}`;
};

/**
 * Downloads a file from a URL
 * @param url The URL of the file to download
 * @param fileName The name to save the file as
 */
export const downloadFile = (url: string, fileName: string): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Safe DOM element removal
  try {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  } catch (error) {
    console.warn('Failed to remove download link from DOM:', error);
  }
};

export const downloadSingleGif = (url: string, segmentIndex: number): void => {
  const link = document.createElement("a");
  link.href = url;
  link.download = generateRandomFileName("gif", `segment-${segmentIndex+1}-`);
  document.body.appendChild(link);
  link.click();
  
  // Safe DOM element removal
  try {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  } catch (error) {
    console.warn('Failed to remove download link from DOM:', error);
  }
  
  toast.success(`Downloading segment ${segmentIndex + 1}`);
};

export const downloadAllGifs = (
  urls: string[],
  setIsDownloading: (value: boolean) => void
): void => {
  if (urls.length === 0) {
    toast.error("No GIFs available to download");
    return;
  }

  if (urls.length === 1) {
    downloadSingleGif(urls[0], 0);
    return;
  }

  // For multiple files, create a download dialog
  createDownloadDialog(urls, setIsDownloading);
};

export const createDownloadDialog = (
  urls: string[],
  setIsDownloading: (value: boolean) => void
): void => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "50%";
  container.style.left = "50%";
  container.style.transform = "translate(-50%, -50%)";
  container.style.zIndex = "9999";
  container.style.background = "white";
  container.style.padding = "20px";
  container.style.borderRadius = "8px";
  container.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
  container.style.maxWidth = "90vw";
  container.style.maxHeight = "90vh";
  container.style.overflow = "auto";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  
  const title = document.createElement("h3");
  title.textContent = `Download ${urls.length} GIF Files`;
  title.style.marginBottom = "15px";
  title.style.borderBottom = "1px solid #eee";
  title.style.paddingBottom = "10px";
  container.appendChild(title);
  
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.padding = "5px 10px";
  closeButton.style.background = "#f1f1f1";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.cursor = "pointer";
  closeButton.onclick = () => {
    // Safe DOM container removal
    try {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    } catch (error) {
      console.warn('Failed to remove download dialog from DOM:', error);
    }
    setIsDownloading(false);
  };
  container.appendChild(closeButton);
  
  const description = document.createElement("p");
  description.textContent = "Due to browser limitations, please click on each link to download the individual GIF file:";
  description.style.marginBottom = "15px";
  container.appendChild(description);
  
  const linksGrid = document.createElement("div");
  linksGrid.style.display = "grid";
  linksGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
  linksGrid.style.gap = "10px";
  
  urls.forEach((url, idx) => {
    const linkWrapper = document.createElement("div");
    linkWrapper.style.border = "1px solid #eee";
    linkWrapper.style.borderRadius = "4px";
    linkWrapper.style.padding = "8px";
    linkWrapper.style.textAlign = "center";
    
    const link = document.createElement("a");
    link.href = url;
    link.download = generateRandomFileName("gif", `segment-${idx+1}-`);
    link.textContent = `Segment ${idx+1}`;
    link.style.color = "#0066cc";
    link.style.textDecoration = "none";
    link.style.display = "block";
    link.style.padding = "5px";
    
    linkWrapper.appendChild(link);
    linksGrid.appendChild(linkWrapper);
  });
  
  container.appendChild(linksGrid);
  document.body.appendChild(container);
  
  toast.success(
    `Prepared ${urls.length} GIFs for download`,
    {
      description: "A dialog with download links has been opened. Click each link to download.",
      duration: 10000
    }
  );
};

export const downloadAsZip = async (
  urls: string[],
  setIsCreatingZip: (value: boolean) => void,
  fileExtension: string = "gif",
  filePrefix: string = "segment"
): Promise<void> => {
  if (urls.length === 0) {
    toast.error(`No files available to download`);
    return;
  }

  // Limit for ZIP creation to prevent memory issues
  const MAX_ZIP_FILES = 500;
  const MAX_ESTIMATED_SIZE_MB = 20480; // 20GB limit for ZIP creation
  
  if (urls.length > MAX_ZIP_FILES) {
    toast.error(`Too many files for ZIP creation (${urls.length}). Maximum: ${MAX_ZIP_FILES}. Using individual download instead.`);
    downloadAllGifs(urls, setIsCreatingZip);
    return;
  }

  setIsCreatingZip(true);
  toast.info(`Creating ZIP archive with ${urls.length} files...`);

  try {
    const zip = new JSZip();
    let totalSizeEstimate = 0;

    // Process files one by one to avoid memory issues
    for (let idx = 0; idx < urls.length; idx++) {
      const url = urls[idx];
      try {
        toast.info(`Processing file ${idx + 1} of ${urls.length} for ZIP...`, { id: "zip-progress" });

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file data: ${response.statusText}`);

        const blob = await response.blob();
        totalSizeEstimate += blob.size;

        // Check if estimated size exceeds limit
        if (totalSizeEstimate > MAX_ESTIMATED_SIZE_MB * 1024 * 1024) {
          toast.error(`ZIP archive too large (>${MAX_ESTIMATED_SIZE_MB}MB). Using individual download instead.`);
          downloadAllGifs(urls, setIsCreatingZip);
          return;
        }

        zip.file(generateRandomFileName(fileExtension, `${filePrefix}-${idx+1}-`), blob);

        // Force garbage collection if available
        if (typeof globalThis.gc === 'function') {
          globalThis.gc();
        }

      } catch (error) {
        console.error(`Error processing file ${idx+1}:`, error);
        toast.error(`Failed to process file ${idx+1}. Skipping...`);
      }
    }

    toast.info("Generating ZIP archive...", { id: "zip-progress" });

    // Generate ZIP with compression to reduce size
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    saveAs(zipBlob, generateRandomFileName("zip", `${filePrefix}s-`));

    toast.success(`ZIP archive with ${urls.length} files created successfully (${(zipBlob.size / 1024 / 1024).toFixed(1)}MB)`);

  } catch (error) {
    console.error("Error creating ZIP file:", error);
    
    // Check if it's a memory-related error
    if (error instanceof Error && (
      error.message.includes("Array buffer allocation failed") ||
      error.message.includes("out of memory") ||
      error.message.includes("Maximum call stack") ||
      error.name === "RangeError"
    )) {
      toast.error("ZIP creation failed due to memory constraints. Using individual download instead.");
      downloadAllGifs(urls, setIsCreatingZip);
    } else {
      toast.error("Failed to create ZIP archive");
    }
  } finally {
    setIsCreatingZip(false);
  }
};
