/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardData } from "./wizard";

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROOM_OPTIONS = [
  "Sala", "Comedor", "Cocina", "Habitación principal", "Habitación 2",
  "Habitación 3", "Baño", "Baño principal", "Terraza", "Balcón",
  "Garaje", "Fachada", "Vista", "Otro",
];

const MIN_PHOTOS = 5;

type PhotoEntry = {
  url: string;
  room: string;
  uploading: boolean;
  error: string | null;
};

export function StepPhotos({ data, updateData, onNext, onBack }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // photos[] and photo_rooms[] are parallel arrays in WizardData
  // We keep a richer local view as PhotoEntry[] derived from them
  // but update both arrays atomically to stay in sync.

  function getEntries(): PhotoEntry[] {
    return data.photos.map((url, i) => ({
      url,
      room: data.photo_rooms[i] ?? "Otro",
      uploading: false,
      error: null,
    }));
  }

  async function uploadFile(file: File): Promise<{ url: string; error: string | null }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) return { url: "", error: json.error ?? "Error al subir" };
      return { url: json.url as string, error: null };
    } catch {
      return { url: "", error: "Error de red al subir la foto" };
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 20 - data.photos.length); // cap at 20 total

    if (fileArr.length === 0) return;

    setUploading(true);
    setGlobalError(null);

    const newUrls: string[] = [];
    const newRooms: string[] = [];
    let failCount = 0;

    try {
      for (const file of fileArr) {
        const { url, error } = await uploadFile(file);
        if (url) {
          newUrls.push(url);
          newRooms.push("Otro");
        } else {
          failCount++;
          console.error("[upload] failed:", error);
        }
      }

      if (newUrls.length > 0) {
        updateData({
          photos: [...data.photos, ...newUrls],
          photo_rooms: [...data.photo_rooms, ...newRooms],
        });
      }

      if (failCount > 0) {
        setGlobalError(
          `${failCount} foto${failCount > 1 ? "s" : ""} no se pudieron subir. Verifica el tamaño (máx. 10 MB) y el formato (JPG, PNG, WebP).`
        );
      }
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function removePhoto(idx: number) {
    const photos = data.photos.filter((_, i) => i !== idx);
    const rooms = data.photo_rooms.filter((_, i) => i !== idx);
    updateData({ photos, photo_rooms: rooms });
  }

  function updateRoom(idx: number, room: string) {
    const rooms = [...data.photo_rooms];
    rooms[idx] = room;
    updateData({ photo_rooms: rooms });
  }

  const readyCount = data.photos.length;
  const canContinue = readyCount >= MIN_PHOTOS && !uploading;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Fotos del inmueble
        </h2>
        <p className="text-sm text-gray-500">
          Sube al menos {MIN_PHOTOS} fotos y etiqueta cada espacio. Las fotos de calidad generan 3× más leads.
        </p>
      </div>

      {/* Upload zone */}
      <label
        className={cn(
          "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-[12px] p-8 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-surface"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center gap-2 text-primary">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Subiendo fotos...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Arrastra fotos aquí o{" "}
                <span className="text-primary">selecciona archivos</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP hasta 10 MB cada una</p>
            </div>
          </>
        )}
      </label>

      {/* Upload error */}
      {globalError && (
        <div className="flex items-start gap-2 rounded-[8px] bg-red-50 border border-red-100 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{globalError}</p>
        </div>
      )}

      {/* Photo grid with room tagging */}
      {data.photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {readyCount} foto{readyCount !== 1 ? "s" : ""} · La primera será la portada
            </p>
            <p className={cn(
              "text-xs font-medium",
              readyCount >= MIN_PHOTOS ? "text-primary" : "text-gray-400"
            )}>
              {readyCount}/{MIN_PHOTOS} mínimo
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.photos.map((url, i) => (
              <div key={i} className="relative group rounded-[8px] overflow-hidden border border-border">
                <div className="aspect-square relative">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-0.5">
                      Portada
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Room selector */}
                <div className="p-1.5 bg-white">
                  <select
                    value={data.photo_rooms[i] ?? "Otro"}
                    onChange={(e) => updateRoom(i, e.target.value)}
                    className="w-full text-xs border border-border rounded-[6px] px-1.5 py-1 bg-white text-foreground focus:outline-none focus:border-primary"
                  >
                    {ROOM_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack} disabled={uploading}>
          Atrás
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={onNext}
          disabled={!canContinue}
          loading={uploading}
        >
          Continuar
        </Button>
      </div>
      {!canContinue && !uploading && readyCount < MIN_PHOTOS && readyCount > 0 && (
        <p className="text-xs text-center text-gray-400">
          Sube {MIN_PHOTOS - readyCount} foto{MIN_PHOTOS - readyCount > 1 ? "s" : ""} más para continuar
        </p>
      )}
      {readyCount === 0 && !uploading && (
        <p className="text-xs text-center text-gray-400">
          Sube al menos {MIN_PHOTOS} fotos para continuar
        </p>
      )}
    </div>
  );
}
