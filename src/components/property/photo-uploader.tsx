"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Star, Trash2 } from "lucide-react";

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
import { formatBytes, titleCase } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ROOM_TAGS } from "@/lib/utils/validation";
import type { PropiedadMedia } from "@/lib/types/database";

const MAX_PHOTO_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type UploadStatus = "queued" | "uploading" | "registering" | "ready" | "error";

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
  initialPhotos: PropiedadMedia[];
  onChange?: (photos: PropiedadMedia[]) => void;
}

export function PhotoUploader({ empresaId, propertyId, initialPhotos, onChange }: Props) {
  const [photos, setPhotos] = useState<PropiedadMedia[]>(initialPhotos);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    onChange?.(photos);
  }, [photos, onChange]);

  const addJob = useCallback((job: UploadJob) => setJobs((p) => [...p, job]), []);
  const updateJob = useCallback(
    (id: string, patch: Partial<UploadJob>) =>
      setJobs((p) => p.map((j) => (j.id === id ? { ...j, ...patch } : j))),
    [],
  );
  const removeJob = useCallback((id: string) => setJobs((p) => p.filter((j) => j.id !== id)), []);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (list.length === 0) return;

      for (const file of list) {
        if (!ACCEPTED.includes(file.type)) {
          toast.error(`${file.name}: We accept JPG, PNG, WebP, HEIC.`);
          continue;
        }
        if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
          toast.error(`${file.name}: Over ${MAX_PHOTO_MB} MB`);
          continue;
        }

        const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        addJob({ id: jobId, file, progress: 10, status: "uploading" });

        try {
          const path = generateStoragePath(empresaId, propertyId, file.name);
          const upload = await uploadFile(file, "listing-photos", path);
          updateJob(jobId, { progress: 80, status: "registering" });

          const res = await fetch("/api/media/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propiedad_id: propertyId,
              media_type: "photo",
              storage_path: upload.storagePath,
              public_url: upload.publicUrl,
              file_size_bytes: file.size,
              mime_type: file.type,
            }),
          });
          const body = await res.json();
          if (!res.ok) throw new Error(body?.error || "Couldn't register the upload.");

          setPhotos((prev) => [...prev, body.media as PropiedadMedia]);
          removeJob(jobId);
          logger.info("media.photo_added", { propertyId, fileSize: file.size });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          updateJob(jobId, { status: "error", errorMessage: message });
          toast.error(message);
        }
      }
    },
    [addJob, empresaId, propertyId, removeJob, updateJob],
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

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Couldn't delete");
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  const handleSetHero = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hero: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't set hero");
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_hero: true } : { ...p, is_hero: false },
        ),
      );
      toast.success("Hero updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't set hero");
    }
  }, []);

  const active = activeId ? photos.find((p) => p.id === activeId) ?? null : null;

  return (
    <div className="space-y-5">
      <div
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
          "rounded-sm border-2 border-dashed bg-paper p-8 text-center transition-colors",
          isDragging
            ? "border-espresso bg-crema-2"
            : "border-rule-strong hover:border-espresso/60",
        )}
      >
        <ImageIcon className="mx-auto mb-3 h-6 w-6 text-text-3" aria-hidden />
        <p className="font-serif text-base font-medium text-text">Add more photos</p>
        <p className="mt-1 text-xs text-text-3">JPG · PNG · WebP — up to {MAX_PHOTO_MB} MB each</p>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Select photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

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
                  <span className="truncate font-mono text-[11px] text-text-2">{job.file.name}</span>
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

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <li
              key={p.id}
              className={cn(
                "group relative overflow-hidden border bg-ivory",
                p.is_hero ? "border-coral" : "border-rule",
              )}
            >
              <button
                type="button"
                onClick={() => setActiveId(p.id)}
                className="block aspect-square w-full"
              >
                {p.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.public_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-3">
                    <ImageIcon className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </button>
              {p.is_hero ? (
                <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 bg-coral px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
                  <Star className="h-2.5 w-2.5 fill-white" aria-hidden /> Hero
                </div>
              ) : null}
              {p.room_tag ? (
                <div className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-espresso/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-text-on-dark backdrop-blur-sm">
                  {titleCase(p.room_tag)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-3">No photos yet. Drop some above.</p>
      )}

      <Dialog open={active !== null} onOpenChange={(o) => (!o ? setActiveId(null) : undefined)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {active ? (
            <PhotoEditor
              photo={active}
              onUpdated={(next) =>
                setPhotos((prev) => prev.map((p) => (p.id === next.id ? next : p)))
              }
              onDelete={() => handleDelete(active.id)}
              onSetHero={() => handleSetHero(active.id)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoEditor({
  photo,
  onUpdated,
  onDelete,
  onSetHero,
}: {
  photo: PropiedadMedia;
  onUpdated: (p: PropiedadMedia) => void;
  onDelete: () => void;
  onSetHero: () => void;
}) {
  const [room, setRoom] = useState<string>(photo.room_tag ?? "");
  const [caption, setCaption] = useState<string>(photo.caption ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = room !== (photo.room_tag ?? "") || caption !== (photo.caption ?? "");

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_tag: room || null,
          caption: caption.trim() || null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Save failed");
      onUpdated(body.media as PropiedadMedia);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {photo.public_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.public_url}
          alt={photo.caption ?? ""}
          className="max-h-[60vh] w-full rounded-sm object-contain"
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`room-${photo.id}`}>Room</Label>
          <Select value={room || undefined} onValueChange={setRoom}>
            <SelectTrigger id={`room-${photo.id}`}>
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
          <Label htmlFor={`cap-${photo.id}`}>Caption</Label>
          <Textarea
            id={`cap-${photo.id}`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="What should buyers notice?"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-2 text-xs text-text-3">
        <span>{formatBytes(photo.file_size_bytes ?? 0)}</span>
        <div className="flex gap-2">
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-3 w-3" /> Delete
          </Button>
          {!photo.is_hero ? (
            <Button type="button" variant="ghost" size="sm" onClick={onSetHero}>
              <Star className="h-3 w-3" /> Make hero
            </Button>
          ) : null}
          <Button type="button" disabled={!dirty || saving} onClick={save}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function labelForStatus(status: UploadStatus, progress: number): string {
  switch (status) {
    case "queued":
      return "Queued";
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
