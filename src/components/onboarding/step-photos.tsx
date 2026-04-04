"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardData } from "./wizard";

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPhotos({ data, updateData, onNext, onBack }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { url } = await res.json();
      return url as string;
    }
    return null;
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 20);
    if (fileArr.length === 0) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of fileArr) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }

    updateData({ photos: [...data.photos, ...urls] });
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function removePhoto(idx: number) {
    updateData({ photos: data.photos.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Fotos del inmueble
        </h2>
        <p className="text-sm text-gray-500">
          Sube al menos 3 fotos. Las fotos de calidad generan 3x más leads.
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
      >
        <input
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
            <span className="text-sm">Subiendo fotos...</span>
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
              <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 10 MB cada una</p>
            </div>
          </>
        )}
      </label>

      {/* Photo grid */}
      {data.photos.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            {data.photos.length} foto{data.photos.length !== 1 ? "s" : ""} · La primera será la portada
          </p>
          <div className="grid grid-cols-3 gap-2">
            {data.photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-[8px] overflow-hidden group">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-1">
                    Portada
                  </div>
                )}
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="md" className="flex-1" onClick={onBack}>
          Atrás
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={onNext}
          disabled={data.photos.length < 1}
        >
          {data.photos.length === 0 ? "Sube al menos 1 foto" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
