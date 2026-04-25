"use client";

import { logger } from "./logger";

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  thumbnail: Blob | null;
}

/**
 * Extract a video's duration, dimensions, and a first-frame thumbnail
 * client-side. Returns null thumbnail if the browser can't decode the file.
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    const fallback: VideoMetadata = {
      duration: 0,
      width: 0,
      height: 0,
      thumbnail: null,
    };

    const timeout = setTimeout(() => {
      logger.warn("video_metadata.timeout", { name: file.name });
      cleanup();
      resolve(fallback);
    }, 10000);

    video.addEventListener("loadedmetadata", () => {
      // Seek to 0.1s so the first decoded frame isn't a black/blank frame.
      try {
        video.currentTime = Math.min(0.1, (video.duration || 0) * 0.05);
      } catch {
        /* ignore */
      }
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        clearTimeout(timeout);
        cleanup();
        resolve({ duration: video.duration || 0, width: w, height: h, thumbnail: null });
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          cleanup();
          resolve({
            duration: video.duration || 0,
            width: w,
            height: h,
            thumbnail: blob,
          });
        },
        "image/jpeg",
        0.85,
      );
    });

    video.addEventListener("error", () => {
      logger.warn("video_metadata.decode_failed", { name: file.name });
      clearTimeout(timeout);
      cleanup();
      resolve(fallback);
    });
  });
}
