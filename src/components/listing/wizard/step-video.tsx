"use client";

import { useState, useRef } from "react";
import { Video, Upload, Loader2, CheckCircle2, X, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { WizardData } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  userId: string;
  onUpdate: (u: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export function StepVideo({ data, userId, onUpdate, onNext, onBack }: Props) {
  const [videoUrl, setVideoUrl] = useState(data.videoUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) { setError("Please select a video file."); return; }
    if (file.size > MAX_VIDEO_SIZE) { setError("Video must be under 500MB."); return; }
    setError(null);
    setUploading(true);
    setProgress(0);

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `listing-videos/${userId}/${Date.now()}.${ext}`;

    // Simulate progress (Supabase JS doesn't expose XHR progress)
    const interval = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 400);

    const { error: upErr } = await supabase.storage
      .from("listing-videos")
      .upload(path, file, { cacheControl: "3600" });

    clearInterval(interval);
    setProgress(100);

    if (upErr) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      setProgress(0);
      return;
    }

    const { data: urlData } = supabase.storage.from("listing-videos").getPublicUrl(path);
    setVideoUrl(urlData.publicUrl);
    onUpdate({ videoUrl: urlData.publicUrl });
    setUploading(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  }

  function clearVideo() {
    setVideoUrl("");
    onUpdate({ videoUrl: "" });
    setProgress(0);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-semibold text-foreground">Add a video tour</h2>
          <span className="text-xs font-medium bg-[#f0f0f0] text-gray-500 px-2 py-0.5 rounded-full">Optional</span>
        </div>
        <p className="text-sm text-gray-500">
          Sellers who upload video tours get <span className="font-semibold text-foreground">73% more showings</span>.
        </p>
      </div>

      {/* Confetti celebration */}
      {showConfetti && (
        <div className="rounded-[8px] bg-primary/10 border border-primary/30 p-4 text-center">
          <p className="text-sm font-semibold text-primary">Amazing! Video listings sell 2x faster.</p>
          <p className="text-xs text-gray-600 mt-1">Your video tour has been added. Buyers will love it.</p>
        </div>
      )}

      {!videoUrl ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-[12px] p-10 flex flex-col items-center gap-4 transition-all",
            uploading ? "border-primary/50 bg-primary/5 cursor-not-allowed" : "border-border bg-[#f8f8f8] hover:border-primary/50 hover:bg-[#f0f0f0] cursor-pointer"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Uploading video...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Video className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drag your video here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">MP4, MOV — max 500MB</p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/mov"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-[12px] overflow-hidden border border-border bg-black aspect-video relative">
            <video src={videoUrl} controls className="w-full h-full" />
            <button
              type="button"
              onClick={clearVideo}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Remove video"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            Video uploaded
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="md" onClick={onBack} className="flex-1">Back</Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => { onUpdate({ videoUrl: "" }); onNext(); }}
          className="flex items-center gap-1.5 text-gray-500"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </Button>
        <Button
          type="button"
          size="md"
          onClick={onNext}
          disabled={uploading}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
