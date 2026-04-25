"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Film, Loader2, Trash2, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/property/upload-zone";
import { logger } from "@/lib/utils/logger";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface StepVideosProps {
  property: Propiedad;
  empresaId: string;
  initialMedia: PropiedadMedia[];
}

export function StepVideos({ property, empresaId, initialMedia }: StepVideosProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<PropiedadMedia[]>(
    initialMedia.filter((m) => m.media_type === "video"),
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete(id: string) {
    const previous = videos;
    setVideos((v) => v.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setVideos(previous);
        toast.error("Couldn't delete video");
      }
    } catch (err) {
      logger.error("step4.delete_exception", { error: err });
      setVideos(previous);
    }
  }

  async function handleNext() {
    setSubmitting(true);
    try {
      await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_step: 5 }),
      });
      logger.info("wizard.step4_complete", { propertyId: property.id, videoCount: videos.length });
      router.push(`/dashboard/property/new?id=${property.id}&step=5`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Add a video tour (optional)
        </h1>
        <p className="text-sm text-brand-muted">
          A walk-through helps buyers picture themselves in your home.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-brand-light-gray bg-brand-mint/15 p-4 text-sm">
        <TrendingUp className="mt-0.5 h-4 w-4 flex-none text-brand-teal" aria-hidden />
        <div>
          <div className="font-medium text-brand-black">Listings with video tours sell 2x faster.</div>
          <p className="mt-1 text-xs text-brand-muted">
            Even a 30-second phone walkthrough makes a difference.
          </p>
        </div>
      </div>

      <UploadZone
        propertyId={property.id}
        empresaId={empresaId}
        bucket="listing-videos"
        mediaType="video"
        accept="video/*"
        maxBytes={500 * 1024 * 1024}
        hint="MP4, MOV, or WEBM up to 500MB"
        onUploaded={(m) => setVideos((prev) => [...prev, m])}
      />

      {videos.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {videos.map((v) => (
            <li
              key={v.id}
              className="relative overflow-hidden rounded-md border border-brand-light-gray bg-black stagger-item"
            >
              <video src={v.public_url ?? undefined} controls className="aspect-video w-full" />
              <div className="flex items-center justify-between border-t border-brand-light-gray bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-brand-muted">
                  <Film className="h-4 w-4" /> Video
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id)}
                  aria-label="Delete video"
                  className="text-error hover:text-error/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="ghost" size="lg" onClick={handleNext} disabled={submitting}>
          Skip for now
        </Button>
        <Button type="button" size="lg" onClick={handleNext} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
