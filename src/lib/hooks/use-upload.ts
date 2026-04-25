"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  generateStoragePath,
  uploadFile,
  type StorageBucket,
} from "@/lib/services/storage";
import { extractVideoMetadata } from "@/lib/utils/video-metadata";
import { logger } from "@/lib/utils/logger";
import type { MediaType, PropiedadMedia } from "@/lib/types/database";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadTicket {
  id: string;
  file: File;
  name: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface UseUploadOptions {
  propertyId: string;
  empresaId: string;
  bucket: StorageBucket;
  mediaType: MediaType;
  validate: (file: File) => { valid: boolean; error?: string };
  concurrency?: number;
  onUploaded: (media: PropiedadMedia) => void;
}

function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useUpload(options: UseUploadOptions) {
  const { propertyId, empresaId, bucket, mediaType, validate, concurrency = 3, onUploaded } =
    options;

  const [uploads, setUploads] = useState<UploadTicket[]>([]);
  const queueRef = useRef<UploadTicket[]>([]);
  const activeRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  function patchTicket(id: string, patch: Partial<UploadTicket>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  const runOne = useCallback(
    async (ticket: UploadTicket) => {
      const { file } = ticket;
      patchTicket(ticket.id, { status: "uploading", progress: 5 });

      try {
        const path = generateStoragePath(empresaId, propertyId, file.name);
        const { publicUrl } = await uploadFile(file, bucket, path);
        patchTicket(ticket.id, { progress: 70 });

        let thumbnailUrl: string | null = null;
        let width: number | null = null;
        let height: number | null = null;
        let duration: number | null = null;

        if (mediaType === "video") {
          const meta = await extractVideoMetadata(file);
          width = meta.width || null;
          height = meta.height || null;
          duration = Math.round(meta.duration) || null;
          if (meta.thumbnail) {
            try {
              const thumbName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
              const thumbFile = new File([meta.thumbnail], thumbName, { type: "image/jpeg" });
              const thumbPath = generateStoragePath(empresaId, propertyId, thumbName);
              const { publicUrl: thumbUrl } = await uploadFile(
                thumbFile,
                "listing-photos",
                thumbPath,
              );
              thumbnailUrl = thumbUrl;
            } catch (err) {
              logger.warn("upload.thumbnail_failed", { name: file.name, error: err });
            }
          }
        }

        patchTicket(ticket.id, { progress: 90 });

        const res = await fetch("/api/media/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propiedad_id: propertyId,
            media_type: mediaType,
            storage_path: path,
            public_url: publicUrl,
            thumbnail_url: thumbnailUrl,
            file_size_bytes: file.size,
            mime_type: file.type,
            width,
            height,
            duration_seconds: duration,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.message ?? "Couldn't save metadata");
        }

        patchTicket(ticket.id, { status: "success", progress: 100 });
        optionsRef.current.onUploaded(json.media as PropiedadMedia);

        // Auto-dismiss successful tickets after 1.5s.
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.id !== ticket.id));
        }, 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        logger.error("upload.exception", { name: file.name, message });
        patchTicket(ticket.id, { status: "error", error: message });
        toast.error(`Couldn't upload ${file.name}`);
      } finally {
        activeRef.current = Math.max(0, activeRef.current - 1);
        drainQueue();
      }
    },
    [bucket, empresaId, mediaType, propertyId],
  );

  const drainQueue = useCallback(() => {
    while (activeRef.current < concurrency && queueRef.current.length > 0) {
      const next = queueRef.current.shift();
      if (!next) break;
      activeRef.current += 1;
      void runOne(next);
    }
  }, [concurrency, runOne]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const accepted: UploadTicket[] = [];

      for (const file of arr) {
        const result = validate(file);
        if (!result.valid) {
          toast.error(`${file.name}: ${result.error}`);
          continue;
        }
        accepted.push({
          id: uniqueId(),
          file,
          name: file.name,
          status: "pending",
          progress: 0,
        });
      }

      if (accepted.length === 0) return;
      setUploads((prev) => [...prev, ...accepted]);
      queueRef.current.push(...accepted);
      drainQueue();
    },
    [drainQueue, validate],
  );

  const removeFile = useCallback((id: string) => {
    queueRef.current = queueRef.current.filter((u) => u.id !== id);
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const retry = useCallback(
    (id: string) => {
      const ticket = uploads.find((u) => u.id === id);
      if (!ticket || ticket.status !== "error") return;
      patchTicket(id, { status: "pending", error: undefined, progress: 0 });
      queueRef.current.push({ ...ticket, status: "pending", progress: 0, error: undefined });
      drainQueue();
    },
    [uploads, drainQueue],
  );

  return { uploads, addFiles, removeFile, retry };
}
