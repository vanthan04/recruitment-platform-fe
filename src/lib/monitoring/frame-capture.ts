/** Longest side sent for analysis — the AI service runs at imgsz 640 anyway. */
export const CAPTURE_MAX_SIDE = 640;
export const CAPTURE_JPEG_QUALITY = 0.7;

/** Target size for a frame: keeps the aspect ratio, never upscales. */
export function captureSize(sourceWidth: number, sourceHeight: number, maxSide = CAPTURE_MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  return { width: Math.round(sourceWidth * scale), height: Math.round(sourceHeight * scale) };
}

/**
 * Grabs the current video frame as a JPEG, downscaled to CAPTURE_MAX_SIDE.
 * Resolves null when there is no frame yet (video not playing / no size).
 */
export function captureJpeg(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<Blob | null> {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return Promise.resolve(null);
  const { width, height } = captureSize(video.videoWidth, video.videoHeight);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", CAPTURE_JPEG_QUALITY));
}
