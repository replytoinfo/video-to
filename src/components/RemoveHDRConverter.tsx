import React, { useState, useRef, useCallback } from 'react';
import { useFFmpeg } from '@/contexts/FFmpegContext';
import { toast } from 'sonner';
import { fetchFile } from '@ffmpeg/ffmpeg';
import ProgressBar from '@/components/common/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Zap } from 'lucide-react';

interface ProcessedVideo {
    original: File;
    processed: Blob;
    fileName: string;
    objectURL: string;
    originalSize: number;
    processedSize: number;
}

const RemoveHDRConverter = () => {
    const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
    const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [currentProcessingFile, setCurrentProcessingFile] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    const { ffmpeg, isFFmpegLoaded } = useFFmpeg();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const videoFiles = files.filter(file => file.type.startsWith('video/'));
        if (videoFiles.length > 0) {
            setSelectedVideos(prev => [...prev, ...videoFiles]);
        } else {
            toast.error('Please drop video files only');
        }
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const videoFiles = files.filter(file => file.type.startsWith('video/'));
        setSelectedVideos(prev => [...prev, ...videoFiles]);
    }, []);

    const removeFile = useCallback((index: number) => {
        setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearAllFiles = useCallback(() => {
        setSelectedVideos([]);
        setProcessedVideos([]);
        // Cleanup URLs
        processedVideos.forEach(video => URL.revokeObjectURL(video.objectURL));
    }, [processedVideos]);

    const processVideos = useCallback(async () => {
        if (selectedVideos.length === 0 || !ffmpeg || !isFFmpegLoaded) return;
        
        setIsProcessing(true);
        setProcessedVideos([]);
        setProcessingProgress(0);

        const results: ProcessedVideo[] = [];

        for (let i = 0; i < selectedVideos.length; i++) {
            const video = selectedVideos[i];
            setCurrentProcessingFile(video.name);
            setProcessingProgress((i / selectedVideos.length) * 100);
            
            const inputName = `input_${i}.mp4`;
            const outputName = `output_${i}.mp4`;
            
            try {
                // Load input
                const inputData = await fetchFile(video);
                ffmpeg.FS('writeFile', inputName, inputData);
                console.log(`Input file ${inputName} loaded, size: ${inputData.length} bytes`);
                
                let processedBlob: Blob;
                
                try {
                    // Simple HDR removal - just copy and remove HDR metadata
                    await ffmpeg.run(
                        '-i', inputName,
                        '-c:v', 'copy',
                        '-c:a', 'copy',
                        '-map_metadata', '-1',
                        '-y',
                        outputName
                    );
                    
                    // Check if output file exists
                    try {
                        const outputData = ffmpeg.FS('readFile', outputName);
                        console.log(`Output file ${outputName} created, size: ${outputData.length} bytes`);
                        
                        if (outputData.length === 0) {
                            throw new Error('Output file is empty');
                        }
                        
                        // Use outputData directly (not .buffer) for FFmpeg v0.10.x
                        processedBlob = new Blob([outputData], { type: 'video/mp4' });
                        console.log(`Processed blob created, size: ${processedBlob.size} bytes`);
                    } catch (readError) {
                        console.error('Failed to read output file:', readError);
                        throw new Error('Output file not found or empty');
                    }
                } catch (error) {
                    console.warn('Stream copy failed, trying re-encode:', error);
                    
                    try {
                        // Fallback 1: re-encode with HDR removal
                        await ffmpeg.run(
                            '-i', inputName,
                            '-c:v', 'libx264',
                            '-c:a', 'copy',
                            '-preset', 'fast',
                            '-crf', '23',
                            '-map_metadata', '-1',
                            '-y',
                            outputName
                        );
                        
                        // Check if fallback output file exists
                        const outputData = ffmpeg.FS('readFile', outputName);
                        console.log(`Fallback output file ${outputName} created, size: ${outputData.length} bytes`);
                        
                        if (outputData.length === 0) {
                            throw new Error('Fallback output file is empty');
                        }
                        
                        // Use outputData directly (not .buffer) for FFmpeg v0.10.x
                        processedBlob = new Blob([outputData], { type: 'video/mp4' });
                        console.log(`Fallback processed blob created, size: ${processedBlob.size} bytes`);
                        
                    } catch (fallbackError) {
                        console.warn('Standard re-encode failed, trying compatibility mode:', fallbackError);
                        
                        // Fallback 2: Maximum compatibility mode
                        await ffmpeg.run(
                            '-i', inputName,
                            '-c:v', 'libx264',
                            '-c:a', 'aac',
                            '-preset', 'ultrafast',
                            '-crf', '28',
                            '-profile:v', 'baseline',
                            '-level', '3.0',
                            '-pix_fmt', 'yuv420p',
                            '-map_metadata', '-1',
                            '-y',
                            outputName
                        );
                        
                        const outputData = ffmpeg.FS('readFile', outputName);
                        console.log(`Compatibility mode output file ${outputName} created, size: ${outputData.length} bytes`);
                        
                        if (outputData.length === 0) {
                            throw new Error('All fallback methods failed');
                        }
                        
                        processedBlob = new Blob([outputData], { type: 'video/mp4' });
                        console.log(`Compatibility mode processed blob created, size: ${processedBlob.size} bytes`);
                    }
                }
                
                // Create result
                const fileName = `${video.name.replace(/\.[^/.]+$/, '')}_no_hdr.mp4`;
                const objectURL = URL.createObjectURL(processedBlob);
                
                const result: ProcessedVideo = {
                    original: video,
                    processed: processedBlob,
                    fileName,
                    objectURL,
                    originalSize: video.size,
                    processedSize: processedBlob.size
                };
                
                results.push(result);
                setProcessedVideos([...results]);
                
            } catch (error) {
                console.error(`Failed to process ${video.name}:`, error);
                toast.error(`Failed to process ${video.name}`);
                // Continue with next file
            } finally {
                // Cleanup FFmpeg files
                try {
                    ffmpeg.FS('unlink', inputName);
                } catch (e) {
                    console.warn('Failed to cleanup input file:', e);
                }
                try {
                    ffmpeg.FS('unlink', outputName);
                } catch (e) {
                    console.warn('Failed to cleanup output file:', e);
                }
            }
        }
        
        setProcessingProgress(100);
        setCurrentProcessingFile('');
        
        if (results.length > 0) {
            toast.success(`Successfully processed ${results.length} of ${selectedVideos.length} videos`);
        } else {
            toast.error('Failed to process any videos');
        }
        
        setIsProcessing(false);
        setProcessingProgress(0);
        setCurrentProcessingFile('');
    }, [selectedVideos, ffmpeg, isFFmpegLoaded]);

    const downloadVideo = useCallback((video: ProcessedVideo) => {
        const link = document.createElement('a');
        link.href = video.objectURL;
        link.download = video.fileName;
        link.click();
    }, []);

    const downloadAllAsZip = useCallback(async () => {
        if (processedVideos.length === 0) return;
        
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            
            processedVideos.forEach(video => {
                zip.file(video.fileName, video.processed);
            });
            
            const zipBlob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(zipBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'hdr-removed-videos.zip';
            link.click();
            
            URL.revokeObjectURL(url);
            toast.success('ZIP file downloaded successfully');
            
        } catch (error) {
            console.error('ZIP download failed:', error);
            toast.error('Failed to download ZIP file');
        }
    }, [processedVideos]);

    return (
        <div className="space-y-6 p-6">
            {/* Title without border - just text */}
            <div className="text-center">
                <h2 className="text-2xl font-bold uppercase tracking-wide flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    Remove HDR from Videos
                </h2>
                <p className="text-muted-foreground mt-2">
                    Fix green/muddy colors from iPhone HDR videos
                </p>
            </div>

            {/* Drop zone - bold with yellow dashed border */}
            <div
                className={`cursor-pointer p-12 text-center border-[3px] border-dashed transition-[transform,box-shadow,background-color] duration-150 ${
                    isDragOver
                        ? 'bg-primary border-foreground border-solid shadow-[6px_6px_0_hsl(var(--foreground))] -translate-x-1 -translate-y-1'
                        : 'bg-muted/40 border-primary hover:bg-muted/60'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="space-y-4">
                    <div className="text-6xl">
                        {isDragOver ? '🎯' : '📱'}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold uppercase">
                            Drop videos here or click to browse
                        </h4>
                        <p className="text-muted-foreground">
                            Select multiple videos at once
                        </p>
                    </div>
                </div>
            </div>

            {selectedVideos.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Selected Videos ({selectedVideos.length})</CardTitle>
                            <Button variant="destructive" size="sm" onClick={clearAllFiles}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {selectedVideos.map((video, index) => (
                                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex-1">
                                        <span className="font-medium">{video.name}</span>
                                        <span className="ml-4 text-sm text-muted-foreground">
                                            {(video.size / (1024 * 1024)).toFixed(1)} MB
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {isProcessing && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Processing: {currentProcessingFile}</span>
                                    <span>{Math.round(processingProgress)}%</span>
                                </div>
                                <ProgressBar value={processingProgress} />
                            </div>
                        )}

                        <Button
                            onClick={processVideos}
                            disabled={isProcessing || !isFFmpegLoaded}
                            className="w-full"
                            size="lg"
                        >
                            {!isFFmpegLoaded ? (
                                'Loading video processor...'
                            ) : isProcessing ? (
                                'Processing videos...'
                            ) : (
                                `Remove HDR from ${selectedVideos.length} video(s)`
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {processedVideos.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Processed Videos ({processedVideos.length})</CardTitle>
                            <Button onClick={downloadAllAsZip}>
                                <Download className="h-4 w-4 mr-2" />
                                Download All as ZIP
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {processedVideos.map((video, index) => (
                            <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                                <video
                                    src={video.objectURL}
                                    controls
                                    className="h-24 w-32 rounded object-cover"
                                />
                                <div className="flex-1 space-y-1">
                                    <div className="text-sm">
                                        <strong>Original:</strong> {video.original.name}
                                    </div>
                                    <div className="text-sm">
                                        <strong>Processed:</strong> {video.fileName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div>Original: {(video.originalSize / (1024 * 1024)).toFixed(1)} MB</div>
                                        <div>Processed: {(video.processedSize / (1024 * 1024)).toFixed(1)} MB</div>
                                        <div>
                                            Compression: {((1 - video.processedSize / video.originalSize) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => downloadVideo(video)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RemoveHDRConverter;