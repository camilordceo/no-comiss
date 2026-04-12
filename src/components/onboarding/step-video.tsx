"use client";

import { useState, useRef } from "react";
import { Video, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WizardData } from "./wizard";

interface Props {
  data: WizardData;
  updateData: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_SIZE_MB = 100;
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm"];

export function StepVideo({ data, updateData, onNext, onBack }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError("Formato no soportado. Usa MP4, MOV o WebM.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El video debe pesar menos de ${MAX_SIZE_MB} MB.`);
      return;
    }

    setUploading(true);
    setProgress("Subiendo video...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Error al subir el video.");
        return;
      }

      updateData({ video_url: json.url as string });
      setProgress(null);
    } catch {
      setError("Error de red. Por favor intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function removeVideo() {
    updateData({ video_url: "" });
    setError(null);
    setProgress(null);
  }

  const hasVideo = !!data.video_url;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Video del inmueble{" "}
          <span className="text-sm font-normal text-gray-400">(opcional)</span>
        </h2>
        <p className="text-sm text-gray-500">
          Un recorrido en video aumenta el tiempo que los compradores pasan en tu listing. MP4, MOV o WebM — máx {MAX_SIZE_MB} MB.
        </p>
      </div>

      {hasVideo ? (
        <div className="rounded-[12px] border border-primary/20 bg-primary/3 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Video subido exitosamente</p>
              <p className="text-xs text-gray-400 truncate">{data.video_url}</p>
            </div>
            <button
              type="button"
              onClick={removeVideo}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
              aria-label="Eliminar video"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <video
            src={data.video_url}
            controls
            className="w-full rounded-[8px] border border-border max-h-48 object-contain bg-black"
            preload="metadata"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-[12px] p-8 cursor-pointer transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-surface"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-primary">
              <svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">{progress}</span>
              <p className="text-xs text-gray-400">Esto puede tomar un momento...</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
                <Video className="w-7 h-7 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground flex items-center gap-2 justify-center">
                  <Upload className="w-4 h-4" />
                  Arrastra tu video o selecciona archivo
                </p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM — máx {MAX_SIZE_MB} MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-[8px] bg-red-50 border border-red-100 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
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
          disabled={uploading}
        >
          {hasVideo ? "Continuar" : "Saltar"}
        </Button>
      </div>
      {!hasVideo && !uploading && (
        <p className="text-xs text-center text-gray-400">
          El video es opcional — puedes agregarlo más tarde desde el dashboard
        </p>
      )}
    </div>
  );
}
