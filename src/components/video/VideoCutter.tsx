import { useState } from "react";
import { toast } from "sonner";
import { Scissors, Download, PlayCircle, FileVideo } from "lucide-react";
import VideoUploader from "@/components/VideoUploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useFFmpeg } from "@/contexts/FFmpegContext";
import FFmpegLoadingIndicator from "@/components/video/FFmpegLoadingIndicator";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadAsZip, generateRandomFileName } from "@/utils/downloadUtils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProcessedSegment {
	videoName: string;
	segmentIndex: number;
	url: string;
	blob: Blob;
}

type CutMode = "segments" | "duration";

const VideoCutter = () => {
	const [videoFiles, setVideoFiles] = useState<File[]>([]);
	const [cutMode, setCutMode] = useState<CutMode>("segments");
	const [segmentCount, setSegmentCount] = useState<string>("3");
	const [customSegmentCount, setCustomSegmentCount] = useState(4);
	const [segmentDuration, setSegmentDuration] = useState<string>("10");
	const [customDuration, setCustomDuration] = useState(15);
	const [isConverting, setIsConverting] = useState(false);
	const [currentFileIndex, setCurrentFileIndex] = useState(-1);
	const [processedSegments, setProcessedSegments] = useState<ProcessedSegment[]>([]);
	const [progress, setProgress] = useState(0);
	const [isCreatingZip, setIsCreatingZip] = useState(false);
	const { t } = useLanguage();

	const { isFFmpegLoaded, isFFmpegLoading, ffmpeg, loadFFmpeg } = useFFmpeg();

	const handleVideoSelected = (files: File[]) => {
		if (files.length === 0) return;

		setVideoFiles(prevFiles => {
			const existingNames = new Set(prevFiles.map(f => f.name));
			const newFiles = files.filter(file => !existingNames.has(file.name));
			return [...prevFiles, ...newFiles];
		});

		setProcessedSegments([]);

		if (!isFFmpegLoaded) {
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

	const getSegmentCount = (): number => {
		if (cutMode === "segments") {
			return segmentCount === "custom" ? customSegmentCount : parseInt(segmentCount);
		}
		return 0;
	};

	const getSegmentDuration = (): number => {
		if (cutMode === "duration") {
			return segmentDuration === "custom" ? customDuration : parseInt(segmentDuration);
		}
		return 0;
	};

	const getVideoDuration = async (file: File): Promise<number> => {
		return new Promise((resolve, reject) => {
			const video = document.createElement("video");
			video.preload = "metadata";

			const timeout = setTimeout(() => {
				URL.revokeObjectURL(video.src);
				video.removeAttribute("src");
				reject(new Error("Metadata loading timeout"));
			}, 10000);

			video.onloadedmetadata = () => {
				clearTimeout(timeout);
				URL.revokeObjectURL(video.src);
				if (!isFinite(video.duration) || video.duration <= 0) {
					reject(new Error("Invalid duration"));
				} else {
					resolve(video.duration);
				}
			};

			video.onerror = () => {
				clearTimeout(timeout);
				URL.revokeObjectURL(video.src);
				reject(new Error("Cannot read video metadata"));
			};

			video.src = URL.createObjectURL(file);
		});
	};

	const getDurationViaFFmpeg = async (inputName: string): Promise<number> => {
		if (!ffmpeg) return 0;
		let duration = 0;
		ffmpeg.setLogger(({ message }: { message: string }) => {
			const match = message.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
			if (match) {
				const [, h, m, s, cs] = match;
				duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(cs) / 100;
			}
		});
		await ffmpeg.run("-i", inputName, "-t", "0.001", "-f", "mp4", "-y", "probe.mp4");
		ffmpeg.setLogger(({ message }: { message: string }) => console.log(`[FFmpeg] ${message}`));
		try { ffmpeg.FS("unlink", "probe.mp4"); } catch { /* file may not exist */ }
		return duration;
	};

	const cutVideoIntoSegments = async (file: File, fileIndex: number): Promise<ProcessedSegment[]> => {
		if (!ffmpeg) return [];

		const { fetchFile } = await import("@ffmpeg/ffmpeg");
		const segments: ProcessedSegment[] = [];

		const inputName = `input_${fileIndex}.mp4`;
		const fileData = await fetchFile(file);
		console.log(`[CUT] File: ${file.name}, size: ${fileData.length} bytes`);
		ffmpeg.FS("writeFile", inputName, fileData);

		let videoDuration: number;
		try {
			videoDuration = await getVideoDuration(file);
		} catch {
			toast.info(t("readingDurationViaFfmpeg"));
			videoDuration = await getDurationViaFFmpeg(inputName);
		}
		console.log(`[CUT] Duration: ${videoDuration}s`);

		if (!isFinite(videoDuration) || videoDuration <= 0) {
			toast.error(t("cannotDetermineDuration"));
			ffmpeg.FS("unlink", inputName);
			return [];
		}

		const segmentsToCreate: Array<{ start: number; duration: number }> = [];

		if (cutMode === "segments") {
			const count = getSegmentCount();
			const segmentDur = videoDuration / count;

			for (let i = 0; i < count; i++) {
				segmentsToCreate.push({
					start: i * segmentDur,
					duration: segmentDur
				});
			}
		} else {
			// By duration mode - avoid short segments at the end
			const duration = getSegmentDuration(); // Minimum segment duration
			const fullSegments = Math.floor(videoDuration / duration); // Number of full segments
			const remainder = videoDuration - (fullSegments * duration); // Remaining time

			if (remainder < duration && remainder > 0) {
				// Remainder is shorter than minimum - add it to the last segment
				// Create fullSegments - 1 standard segments
				for (let i = 0; i < fullSegments - 1; i++) {
					segmentsToCreate.push({
						start: i * duration,
						duration: duration
					});
				}
				// Last segment with added remainder (will be longer than specified)
				if (fullSegments > 0) {
					segmentsToCreate.push({
						start: (fullSegments - 1) * duration,
						duration: duration + remainder
					});
				} else {
					// Video is shorter than minimum duration - take entire video
					segmentsToCreate.push({
						start: 0,
						duration: videoDuration
					});
				}
			} else {
				// All segments are standard duration (remainder is 0 or >= minimum)
				for (let i = 0; i < fullSegments; i++) {
					segmentsToCreate.push({
						start: i * duration,
						duration: duration
					});
				}
			}
		}

		for (let i = 0; i < segmentsToCreate.length; i++) {
			const segment = segmentsToCreate[i];
			const outputFileName = `segment_${fileIndex}_${i}.mp4`;

			console.log(`[CUT] Segment ${i + 1}/${segmentsToCreate.length}: start=${segment.start}, duration=${segment.duration}`);
			toast.info(t("processingSegmentToast").replace("{file}", file.name).replace("{current}", String(i + 1)).replace("{total}", String(segmentsToCreate.length)));

			await ffmpeg.run(
				"-ss", segment.start.toString(),
				"-i", inputName,
				"-t", segment.duration.toString(),
				"-c:v", "libx264",
				"-preset", "ultrafast",
				"-crf", "23",
				"-pix_fmt", "yuv420p",
				"-c:a", "aac",
				"-b:a", "128k",
				"-movflags", "+faststart",
				"-max_muxing_queue_size", "1024",
				outputFileName
			);

			let data: Uint8Array;
			try {
				data = ffmpeg.FS("readFile", outputFileName);
			} catch {
				toast.error(t("segmentProcessFailed").replace("{index}", String(i + 1)));
				ffmpeg.FS("unlink", inputName);
				return segments;
			}

			console.log(`[CUT] Segment ${i + 1} output: ${data.length} bytes`);
			if (data.length === 0) {
				toast.error(t("codecNotSupportedCutting"));
				ffmpeg.FS("unlink", inputName);
				return segments;
			}

			const blob = new Blob([data], { type: "video/mp4" });
			const url = URL.createObjectURL(blob);

			segments.push({
				videoName: file.name,
				segmentIndex: i,
				url,
				blob
			});

			ffmpeg.FS("unlink", outputFileName);

			setProgress(Math.round(((i + 1) / segmentsToCreate.length) * 100));
		}

		ffmpeg.FS("unlink", inputName);

		return segments;
	};

	const startBatchCutting = async () => {
		if (!videoFiles.length || !isFFmpegLoaded || !ffmpeg) {
			toast.error(t("ffmpegNotLoaded"));
			return;
		}

		setIsConverting(true);
		setCurrentFileIndex(0);
		setProcessedSegments([]);

		const allSegments: ProcessedSegment[] = [];

		for (let i = 0; i < videoFiles.length; i++) {
			const file = videoFiles[i];
			setCurrentFileIndex(i);
			setProgress(0);

			try {
				toast.info(t("processingVideoOfToast").replace("{current}", String(i + 1)).replace("{total}", String(videoFiles.length)).replace("{file}", file.name));

				const segments = await cutVideoIntoSegments(file, i);
				allSegments.push(...segments);
				setProcessedSegments([...allSegments]);

				toast.success(t("createdSegmentsToast").replace("{file}", file.name).replace("{count}", String(segments.length)));
			} catch (error) {
				console.error(`Error cutting ${file.name}:`, error);
				toast.error(t("errorProcessingFile").replace("{file}", file.name).replace("{message}", error instanceof Error ? error.message : "Unknown error"));
			}
		}

		setIsConverting(false);
		setCurrentFileIndex(-1);
		setProgress(0);

		toast.success(t("processingComplete"), {
			description: t("createdSegmentsFromVideos").replace("{segCount}", String(allSegments.length)).replace("{videoCount}", String(videoFiles.length)),
			duration: 5000
		});
	};

	const handleDownloadAll = async () => {
		if (processedSegments.length === 0) {
			toast.error(t("noSegmentsToDownload"));
			return;
		}

		const urls = processedSegments.map(seg => seg.url);
		await downloadAsZip(urls, setIsCreatingZip, "mp4", "video-segment");
	};

	const handleDownloadSingle = (segment: ProcessedSegment) => {
		const link = document.createElement("a");
		link.href = segment.url;
		link.download = generateRandomFileName("mp4", `${segment.videoName.replace(/\.[^/.]+$/, "")}-segment-${segment.segmentIndex + 1}-`);
		link.click();

		toast.success(t("downloadingSegmentToast").replace("{index}", String(segment.segmentIndex + 1)));
	};

	return (
		<div className="w-full space-y-6">
			{isFFmpegLoading && <FFmpegLoadingIndicator isLoading={isFFmpegLoading} />}

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Scissors className="h-5 w-5" />
						{t("videoCutter")}
					</CardTitle>
					<CardDescription>
						{t("cutterDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<VideoUploader onVideoSelected={handleVideoSelected} multiple={true} />

					{videoFiles.length > 0 && (
						<div className="space-y-4">
							<div className="rounded-lg border p-4 bg-secondary/20">
								<h4 className="font-medium mb-3 flex items-center gap-2">
									<FileVideo className="h-4 w-4" />
									{t("cutterUploadedVideos").replace("{count}", String(videoFiles.length))}
								</h4>
								<div className="space-y-2">
									{videoFiles.map((file, index) => (
										<div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-background rounded border">
											<span className="text-sm truncate flex-1">{file.name}</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRemoveVideo(index)}
												disabled={isConverting}
											>
												{t("remove")}
											</Button>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-lg border p-4 space-y-4">
								<h4 className="font-medium">{t("cuttingSettings")}</h4>

								<div className="space-y-4">
									<div>
										<Label className="mb-3 block">{t("cutModeLabel")}</Label>
										<RadioGroup
											value={cutMode}
											onValueChange={(value) => setCutMode(value as CutMode)}
											className="space-y-3"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="segments" id="mode-segments" />
												<Label htmlFor="mode-segments" className="cursor-pointer">
													{t("cutModeSegmentsLabel")}
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="duration" id="mode-duration" />
												<Label htmlFor="mode-duration" className="cursor-pointer">
													{t("cutModeDurationLabel")}
												</Label>
											</div>
										</RadioGroup>
									</div>

									{cutMode === "segments" && (
										<div>
											<Label className="mb-3 block">{t("numberOfSegmentsLabel")}</Label>
											<RadioGroup
												value={segmentCount}
												onValueChange={setSegmentCount}
												className="space-y-2"
											>
												{["2", "3", "4", "5"].map((num) => (
													<div key={num} className="flex items-center space-x-2">
														<RadioGroupItem value={num} id={`seg-${num}`} />
														<Label htmlFor={`seg-${num}`} className="cursor-pointer">
															{t("segmentsCountPrefix")} {num}
														</Label>
													</div>
												))}
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="custom" id="seg-custom" />
													<Label htmlFor="seg-custom" className="cursor-pointer">{t("customLabel")}</Label>
													<Input
														type="number"
														min={2}
														max={20}
														value={customSegmentCount}
														onChange={(e) => setCustomSegmentCount(parseInt(e.target.value) || 4)}
														disabled={segmentCount !== "custom"}
														className="w-20"
													/>
													<span className="text-sm text-muted-foreground">{t("segmentsWord")}</span>
												</div>
											</RadioGroup>
										</div>
									)}

									{cutMode === "duration" && (
										<div>
											<Label className="mb-3 block">{t("minSegmentDuration")}</Label>
											<RadioGroup
												value={segmentDuration}
												onValueChange={setSegmentDuration}
												className="space-y-2"
											>
												{["5", "10", "15", "30"].map((value) => (
													<div key={value} className="flex items-center space-x-2">
														<RadioGroupItem value={value} id={`dur-${value}`} />
														<Label htmlFor={`dur-${value}`} className="cursor-pointer">
															{t("secondsCountPrefix")} {value}
														</Label>
													</div>
												))}
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="custom" id="dur-custom" />
													<Label htmlFor="dur-custom" className="cursor-pointer">{t("customLabel")}</Label>
													<Input
														type="number"
														min={1}
														max={300}
														value={customDuration}
														onChange={(e) => setCustomDuration(parseInt(e.target.value) || 15)}
														disabled={segmentDuration !== "custom"}
														className="w-20"
													/>
													<span className="text-sm text-muted-foreground">{t("seconds")}</span>
												</div>
											</RadioGroup>
											<p className="text-xs text-muted-foreground mt-2">
												{t("cutModeDurationNote")}
											</p>
										</div>
									)}
								</div>
							</div>

							<div className="flex flex-wrap gap-3">
								<Button
									onClick={startBatchCutting}
									disabled={isConverting || !isFFmpegLoaded || videoFiles.length === 0}
									className="flex items-center gap-2"
								>
									{isConverting ? (
										<>
											<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
											{t("processing")}
										</>
									) : (
										<>
											<PlayCircle className="h-4 w-4" />
											{t("cutAllVideos")}
										</>
									)}
								</Button>

								{processedSegments.length > 0 && (
									<Button
										variant="outline"
										onClick={handleDownloadAll}
										disabled={isConverting || isCreatingZip}
										className="flex items-center gap-2"
									>
										{isCreatingZip ? (
											<>
												<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
												{t("creatingZip")}
											</>
										) : (
											<>
												<Download className="h-4 w-4" />
												{t("downloadAllAsZipCount").replace("{count}", String(processedSegments.length))}
											</>
										)}
									</Button>
								)}
							</div>

							{isConverting && currentFileIndex >= 0 && (
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>{t("processingFilePrefix")} {videoFiles[currentFileIndex]?.name}</span>
										<span>{progress}%</span>
									</div>
									<Progress value={progress} />
									<p className="text-xs text-muted-foreground">
										{t("videoWord")} {currentFileIndex + 1} {t("hdrOf")} {videoFiles.length}
									</p>
								</div>
							)}
						</div>
					)}

					{processedSegments.length > 0 && (
						<div className="rounded-lg border p-4 space-y-4">
							<div className="flex justify-between items-center">
								<h4 className="font-medium">
									{t("processedSegmentsCount").replace("{count}", String(processedSegments.length))}
								</h4>
								<Button
									size="sm"
									variant="outline"
									onClick={handleDownloadAll}
									disabled={isCreatingZip}
								>
									<Download className="h-4 w-4 mr-2" />
									{t("downloadAll")}
								</Button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								{processedSegments.map((segment, index) => (
									<div key={index} className="border rounded-lg p-3 space-y-2">
										<div className="aspect-video bg-black rounded overflow-hidden">
											<video
												src={segment.url}
												controls
												className="w-full h-full object-contain"
											/>
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{segment.videoName} - {t("segment")} {segment.segmentIndex + 1}
										</div>
										<Button
											size="sm"
											variant="outline"
											className="w-full"
											onClick={() => handleDownloadSingle(segment)}
										>
											<Download className="h-3 w-3 mr-2" />
											{t("download")}
										</Button>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default VideoCutter;
