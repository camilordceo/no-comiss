"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Star, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardData, PhotoItem } from "./types";
import { ROOM_OPTIONS } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  userId: string;
  onUpdate: (u: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function genId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function StepPhotos({ data, userId, onUpdate, onNext, onBack }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>(data.photos);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, listingId = "tmp"): Promise<PhotoItem | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("listingId", listingId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("Upload error:", body.error ?? res.statusText);
      return null;
    }

    const { url } = await res.json();
    return {
      id: genId(),
      url,
      path: url,
      room: "Other",
      isHero: false,
      uploading: false,
      error: null,
    };
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;

    const oversized = arr.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`${oversized.length} file(s) exceed 10MB and were skipped.`);
    }
    const valid = arr.filter((f) => f.size <= MAX_FILE_SIZE);

    if (photos.length + valid.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    setError(null);

    // Add placeholders immediately for visual feedback
    const placeholders: PhotoItem[] = valid.map((f) => ({
      id: genId(),
      url: URL.createObjectURL(f),
      path: "",
      room: "Other",
      isHero: false,
      uploading: true,
      error: null,
    }));

    setPhotos((prev) => {
      const next = [...prev, ...placeholders];
      onUpdate({ photos: next });
      return next;
    });

    // Upload in parallel
    const results = await Promise.all(
      valid.map(async (file, i) => {
        const result = await uploadFile(file);
        return { placeholderId: placeholders[i].id, result };
      })
    );

    // Replace placeholders with real URLs (or mark failed)
    setPhotos((prev) => {
      const next = prev.map((p) => {
        const match = results.find((r) => r.placeholderId === p.id);
        if (!match) return p;
        if (!match.result) return { ...p, uploading: false, error: "Upload failed" };
        return { ...match.result, id: p.id };
      });
      onUpdate({ photos: next });
      return next;
    });

    // Show error if any failed
    const failCount = results.filter((r) => !r.result).length;
    if (failCount > 0) {
      setError(`${failCount} photo(s) failed to upload. Check your connection and try again.`);
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos.length]
  );

  function movePhoto(idx: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      onUpdate({ photos: next });
      return next;
    });
  }

  function setHero(id: string) {
    setPhotos((prev) => {
      const next = prev.map((p) => ({ ...p, isHero: p.id === id }));
      onUpdate({ photos: next });
      return next;
    });
  }

  function setRoom(id: string, room: string) {
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, room } : p));
      onUpdate({ photos: next });
      return next;
    });
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      onUpdate({ photos: next });
      return next;
    });
  }

  function handleNext() {
    const ready = photos.filter((p) => !p.uploading && !p.error);
    if (ready.length < MIN_PHOTOS) {
      setError(`Add at least ${MIN_PHOTOS} photos to continue. (${ready.length}/${MIN_PHOTOS} ready)`);
      return;
    }
    setError(null);
    onNext();
  }

  const uploadingCount = photos.filter((p) => p.uploading).length;
  const readyCount = photos.filter((p) => !p.uploading && !p.error).length;
  // Suppress unused variable warning — userId is kept for future use
  void userId;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Add photos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Great photos sell homes faster. Include all rooms and the exterior.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-[12px] p-8 flex flex-col items-center gap-3 cursor-pointer transition-all duration-150",
          dragging ? "border-primary bg-primary/5" : "border-border bg-[#f8f8f8] hover:border-primary/50 hover:bg-[#f0f0f0]"
        )}
      >
        <Upload className="w-8 h-8 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Drag photos here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10MB each · Min {MIN_PHOTOS}, max {MAX_PHOTOS}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Status bar */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{readyCount} photo{readyCount !== 1 ? "s" : ""} ready</span>
          {uploadingCount > 0 && (
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Uploading {uploadingCount}…
            </span>
          )}
          <span className="text-gray-400">{readyCount}/{MIN_PHOTOS} min</span>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative rounded-[8px] overflow-hidden border border-border group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.room}
                className={cn("w-full aspect-[4/3] object-cover", photo.uploading && "opacity-50")}
              />

              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}

              {photo.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 gap-1 p-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-[10px] text-red-600 text-center">Upload failed</span>
                </div>
              )}

              {photo.isHero && !photo.uploading && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" /> Hero
                </div>
              )}

              {!photo.uploading && !photo.error && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); movePhoto(idx, -1); }}
                        disabled={idx === 0}
                        className="w-6 h-6 rounded bg-white/20 flex items-center justify-center disabled:opacity-30 hover:bg-white/40 transition-colors"
                        aria-label="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); movePhoto(idx, 1); }}
                        disabled={idx === photos.length - 1}
                        className="w-6 h-6 rounded bg-white/20 flex items-center justify-center disabled:opacity-30 hover:bg-white/40 transition-colors"
                        aria-label="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                      className="w-6 h-6 rounded bg-white/20 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={photo.room}
                      onChange={(e) => { e.stopPropagation(); setRoom(photo.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-xs bg-white/20 text-white rounded px-1.5 py-1 border-0 outline-none cursor-pointer"
                    >
                      {ROOM_OPTIONS.map((r) => <option key={r} value={r} className="text-foreground bg-white">{r}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setHero(photo.id); }}
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center transition-colors",
                        photo.isHero ? "bg-primary" : "bg-white/20 hover:bg-primary/80"
                      )}
                      aria-label="Set as hero photo"
                    >
                      <Star className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button type="button" size="md" onClick={handleNext} disabled={uploadingCount > 0} className="flex-1">
          {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : "Continue"}
        </Button>
      </div>
    </div>
  );
}
