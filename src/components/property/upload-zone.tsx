"use client";

import { useCallback, useRef, useState } from "react";
import { CloudUpload } from "lucide-react";

import { useUpload } from "@/lib/hooks/use-upload";
import { validateImageFile, validateVideoFile } from "@/lib/utils/file-validation";
import { cn } from "@/lib/utils/cn";
import type { MediaType, PropiedadMedia } from "@/lib/types/database";
import { UploadProgressPanel } from "./upload-progress-panel";

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

export function UploadZone({
  propertyId,
  empresaId,
  bucket,
  mediaType,
  accept,
  multiple = true,
  onUploaded,
  hint,
  cta = "Click to upload or drag and drop",
}: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File) => (mediaType === "video" ? validateVideoFile(file) : validateImageFile(file)),
    [mediaType],
  );

  const { uploads, addFiles, removeFile, retry } = useUpload({
    propertyId,
    empresaId,
    bucket,
    mediaType,
    validate,
    onUploaded,
  });

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
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
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
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <UploadProgressPanel uploads={uploads} onDismiss={removeFile} onRetry={retry} />
    </div>
  );
}
