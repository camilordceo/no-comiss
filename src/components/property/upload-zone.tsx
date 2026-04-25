"use client";

import { useCallback, useRef, useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { cn } from "@/lib/utils/cn";
import type { PropiedadMedia, MediaType } from "@/lib/types/database";

interface UploadZoneProps {
  propertyId: string;
  empresaId: string;
  bucket: "listing-photos" | "listing-videos";
  mediaType: MediaType;
  accept: string;
  maxBytes: number;
  multiple?: boolean;
  onUploaded: (media: PropiedadMedia) => void;
  hint?: string;
  cta?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function UploadZone({
  propertyId,
  empresaId,
  bucket,
  mediaType,
  accept,
  maxBytes,
  multiple = true,
  onUploaded,
  hint,
  cta = "Click to upload or drag and drop",
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      if (fileArr.length === 0) return;

      const supabase = createClient();

      for (const file of fileArr) {
        if (file.size > maxBytes) {
          toast.error(`${file.name} is larger than ${Math.round(maxBytes / 1024 / 1024)}MB`);
          continue;
        }
        const ticket: UploadingFile = { id: uniqueId(), name: file.name, progress: 0 };
        setUploading((prev) => [...prev, ticket]);

        try {
          const ext = file.name.split(".").pop() ?? "bin";
          const safeName = `${uniqueId()}.${ext}`;
          const storagePath = `${empresaId}/${propertyId}/${safeName}`;

          logger.info("upload.start", { name: file.name, size: file.size, mediaType });

          const { error: storageErr } = await supabase.storage
            .from(bucket)
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

          if (storageErr) {
            logger.error("upload.storage_failed", { message: storageErr.message, path: storagePath });
            setUploading((prev) =>
              prev.map((u) => (u.id === ticket.id ? { ...u, error: storageErr.message } : u)),
            );
            toast.error(`Couldn't upload ${file.name}`);
            continue;
          }

          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);

          const res = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propiedad_id: propertyId,
              media_type: mediaType,
              storage_path: storagePath,
              public_url: pub.publicUrl,
              file_size_bytes: file.size,
              mime_type: file.type,
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            logger.error("upload.metadata_failed", { status: res.status, json });
            toast.error(`Saved ${file.name} but couldn't record metadata`);
            continue;
          }

          logger.info("upload.complete", { mediaId: json.media.id });
          setUploading((prev) => prev.filter((u) => u.id !== ticket.id));
          onUploaded(json.media as PropiedadMedia);
        } catch (err) {
          logger.error("upload.exception", { error: err });
          setUploading((prev) =>
            prev.map((u) => (u.id === ticket.id ? { ...u, error: "upload failed" } : u)),
          );
          toast.error(`Couldn't upload ${file.name}`);
        }
      }
    },
    [bucket, empresaId, maxBytes, mediaType, onUploaded, propertyId],
  );

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-white px-6 py-10 text-center transition-all",
          dragActive
            ? "border-brand-teal bg-brand-mint/10"
            : "border-brand-light-gray hover:border-brand-teal hover:bg-brand-bg-alt",
        )}
        aria-label={cta}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint/30">
          <CloudUpload className="h-5 w-5 text-brand-teal" aria-hidden />
        </div>
        <div className="text-sm font-medium text-brand-black">{cta}</div>
        {hint ? <div className="text-xs text-brand-muted">{hint}</div> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {uploading.length > 0 ? (
        <ul className="space-y-2">
          {uploading.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-md border border-brand-light-gray bg-white px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-teal" aria-hidden />
                <span className="truncate text-brand-black">{u.name}</span>
              </div>
              <span className="text-xs text-brand-muted">
                {u.error ? <span className="text-error">{u.error}</span> : "Uploading…"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
