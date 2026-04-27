"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Play, Trash2, Video as VideoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { uploadFile, generateStoragePath } from "@/lib/services/storage";
import { logger } from "@/lib/utils/logger";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ROOM_TAGS } from "@/lib/utils/validation";
import type { PropiedadMedia } from "@/lib/types/database";
import { FirstVideoCelebration } from "./first-video-celebration";

const MAX_VIDEO_MB = 500;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
const ACCEPT_INPUT = ".mp4,.mov,.webm,.m4v,video/mp4,video/quicktime,video/webm";

type UploadStatus = "queued" | "extracting" | "uploading" | "registering" | "ready" | "error";

interface UploadJob {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
}

interface Props {
  empresaId: string;
  propertyId: string;
  initialVideos: PropiedadMedia[];
  hadVideoBefore: boolean;
  onChange?: (videos: PropiedadMedia[]) => void;
}

export function VideoUploader({
  empresaId,
  propertyId,
  initialVideos,
  hadVideoBefore,
  onChange,
}: Props) {
  const [videos, setVideos] = useState<PropiedadMedia[]>(initialVideos);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Surface video state to parent for content score recompute.
  useEffect(() => {
    onChange?.(videos);
  }, [videos, onChange]);

  const addJob = useCallback((job: UploadJob) => {
    setJobs((prev) => [...prev, job]);
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      let firstUploadOfSession = !hadVideoBefore && videos.length === 0;

      for (const file of list) {
        const isAccepted =
          ACCEPTED.includes(file.type) ||
          /\.(mp4|mov|webm|m4v)$/i.test(file.name);
        if (!isAccepted) {
          toast.error(`${file.name}: We accept MP4, MOV, and WebM files.`);
          continue;
        }
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
          toast.error(
            `${file.name}: Videos must be under ${MAX_VIDEO_MB} MB. Try compressing or recording at a lower resolution.`,
          );
          continue;
        }

        const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        addJob({ id: jobId, file, progress: 0, status: "queued" });

        try {
          const created = await uploadOneVideo({
            file,
            jobId,
            empresaId,
            propertyId,
            onProgress: (progress, status) => updateJob(jobId, { progress, status }),
          });

          setVideos((prev) => [...prev, created]);
          removeJob(jobId);

          if (firstUploadOfSession) {
            firstUploadOfSession = false;
            setCelebrate(true);
          } else {
            toast.success("Video uploaded! Your Content Score just went up.");
          }

          logger.info("media.video_uploaded", {
            propertyId,
            duration: created.duration_seconds,
            fileSize: created.file_size_bytes,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          logger.warn("media.video_upload_failed", { propertyId, message });
          updateJob(jobId, { status: "error", errorMessage: message });
          toast.error(message);
        }
      }
    },
    [addJob, empresaId, hadVideoBefore, propertyId, removeJob, updateJob, videos.length],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDelete = useCallback(async (mediaId: string) => {
    try {
      const res = await fetch(`/api/media/${mediaId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Couldn't delete the video");
      }
      setVideos((prev) => prev.filter((v) => v.id !== mediaId));
      setActiveId((cur) => (cur === mediaId ? null : cur));
      toast.success("Video removed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
    }
  }, []);

  const activeVideo = activeId ? videos.find((v) => v.id === activeId) ?? null : null;

  return (
    <div className="space-y-5">
      {/* ─── Drop zone ─── */}
      <div
        ref={dropRef}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "rounded-sm border-2 border-dashed p-10 text-center transition-colors bg-ivory",
          isDragging
            ? "border-espresso bg-crema-2"
            : "border-rule-strong hover:border-espresso hover:bg-crema-2",
        )}
      >
        <VideoIcon className="mx-auto mb-3 h-7 w-7 text-text-3" aria-hidden />
        <p className="font-sans text-base font-semibold text-text">
          Drop your home tour videos here
        </p>
        <p className="mt-1 font-sans text-xs text-text-3">
          MP4, MOV or WebM · Up to {MAX_VIDEO_MB} MB
        </p>
        <Button
          type="button"
          variant="default"
          className="mt-5"
          onClick={() => inputRef.current?.click()}
        >
          Select video
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_INPUT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* ─── In-flight upload jobs ─── */}
      {jobs.length > 0 ? (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-center gap-3 border border-rule bg-ivory px-4 py-3"
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-text-3" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-[11px] text-text-2">
                    {job.file.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                    {labelForStatus(job.status, job.progress)}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-sm bg-crema-2">
                  <div
                    className={cn(
                      "h-full transition-all duration-200",
                      job.status === "error" ? "bg-rust" : "bg-espresso",
                    )}
                    style={{ width: `${Math.max(4, Math.min(100, job.progress))}%` }}
                  />
                </div>
                {job.status === "error" && job.errorMessage ? (
                  <p className="mt-1 text-xs text-rust">{job.errorMessage}</p>
                ) : null}
              </div>
              {job.status === "error" ? (
                <button
                  type="button"
                  onClick={() => removeJob(job.id)}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3 hover:text-text"
                >
                  Dismiss
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* ─── Video gallery ─── */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          <div className="data-key">
            {videos.length} video{videos.length === 1 ? "" : "s"}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {videos.map((video) => (
              <li
                key={video.id}
                className="group relative overflow-hidden border border-rule bg-ivory"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(video.id)}
                  className="relative block w-full text-left"
                >
                  <div className="aspect-square w-full bg-crema-2">
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-3">
                        <VideoIcon className="h-6 w-6" aria-hidden />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-espresso/75 text-text-on-dark backdrop-blur-sm">
                        <Play className="h-5 w-5 fill-current" aria-hidden />
                      </span>
                    </div>
                    {video.duration_seconds != null ? (
                      <div className="absolute bottom-2 right-2 rounded-sm bg-espresso/85 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-text-on-dark">
                        {formatDuration(video.duration_seconds)}
                      </div>
                    ) : null}
                  </div>
                </button>
                <div className="border-t border-rule px-2.5 py-2">
                  <div className="truncate font-mono text-[11px] text-text-2">
                    {fileNameFromPath(video.storage_path)}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                    <span>{formatBytes(video.file_size_bytes ?? 0)}</span>
                    <span>Ready</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ─── Preview modal ─── */}
      <Dialog
        open={activeVideo !== null}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {activeVideo ? fileNameFromPath(activeVideo.storage_path) : "Video"}
            </DialogTitle>
          </DialogHeader>
          {activeVideo ? (
            <VideoPreview
              video={activeVideo}
              onUpdated={(updated) =>
                setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
              }
              onDelete={() => handleDelete(activeVideo.id)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <FirstVideoCelebration open={celebrate} onClose={() => setCelebrate(false)} />
    </div>
  );
}

interface PreviewProps {
  video: PropiedadMedia;
  onUpdated: (next: PropiedadMedia) => void;
  onDelete: () => void;
}

function VideoPreview({ video, onUpdated, onDelete }: PreviewProps) {
  const [roomTag, setRoomTag] = useState<string>(video.room_tag ?? "");
  const [caption, setCaption] = useState<string>(video.caption ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = roomTag !== (video.room_tag ?? "") || caption !== (video.caption ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_tag: roomTag || null,
          caption: caption.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't save");
      onUpdated(body.media as PropiedadMedia);
      toast.success("Saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {video.public_url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={video.public_url}
          controls
          preload="metadata"
          poster={video.thumbnail_url ?? undefined}
          className="w-full rounded-sm border border-rule bg-espresso"
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`room-${video.id}`}>Room</Label>
          <Select value={roomTag || undefined} onValueChange={(v) => setRoomTag(v)}>
            <SelectTrigger id={`room-${video.id}`}>
              <SelectValue placeholder="Pick a room" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TAGS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`caption-${video.id}`}>Caption</Label>
          <Textarea
            id={`caption-${video.id}`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="What should buyers notice?"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-3 w-3" /> Delete
        </Button>
        <Button type="button" disabled={!dirty || saving} onClick={save}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

interface UploadOptions {
  file: File;
  jobId: string;
  empresaId: string;
  propertyId: string;
  onProgress: (progress: number, status: UploadStatus) => void;
}

async function uploadOneVideo({
  file,
  empresaId,
  propertyId,
  onProgress,
}: UploadOptions): Promise<PropiedadMedia> {
  // Step 1: extract metadata in parallel with starting upload.
  onProgress(8, "extracting");
  const [duration, thumbnailBlob] = await Promise.all([
    extractDuration(file).catch(() => null),
    extractThumbnail(file).catch(() => null),
  ]);

  // Step 2: upload the video file.
  onProgress(20, "uploading");
  const videoPath = generateStoragePath(empresaId, propertyId, file.name);
  const videoUpload = await uploadFile(file, "listing-videos", videoPath);
  onProgress(70, "uploading");

  // Step 3: upload the thumbnail (if extracted) to listing-photos bucket.
  let thumbnailUrl: string | null = null;
  if (thumbnailBlob) {
    try {
      const thumbName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      const thumbPath = generateStoragePath(empresaId, propertyId, `thumb-${thumbName}`);
      const thumbFile = new File([thumbnailBlob], thumbName, { type: "image/jpeg" });
      const thumbUpload = await uploadFile(thumbFile, "listing-photos", thumbPath);
      thumbnailUrl = thumbUpload.publicUrl;
    } catch (err) {
      logger.warn("media.video_thumbnail_upload_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  onProgress(85, "registering");

  // Step 4: register the media row.
  const res = await fetch("/api/media/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propiedad_id: propertyId,
      media_type: "video",
      storage_path: videoUpload.storagePath,
      public_url: videoUpload.publicUrl,
      thumbnail_url: thumbnailUrl,
      file_size_bytes: file.size,
      mime_type: file.type || "video/mp4",
      duration_seconds: duration ?? null,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || "Upload registered to storage but DB insert failed.");
  }
  onProgress(100, "ready");
  return body.media as PropiedadMedia;
}

function extractThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadedmetadata = () => {
      // Seek to 1s, or earlier if the video is shorter.
      const target = Math.min(1, Math.max(0, video.duration - 0.1));
      video.currentTime = isFinite(target) ? target : 0;
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("No canvas context"));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            blob ? resolve(blob) : reject(new Error("No blob produced"));
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Video load failed"));
    };
  });
}

function extractDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      const seconds = Math.round(video.duration);
      URL.revokeObjectURL(url);
      resolve(isFinite(seconds) ? seconds : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration"));
    };
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fileNameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function labelForStatus(status: UploadStatus, progress: number): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "extracting":
      return "Reading";
    case "uploading":
      return `${progress}%`;
    case "registering":
      return "Saving";
    case "ready":
      return "Done";
    case "error":
      return "Error";
  }
}
