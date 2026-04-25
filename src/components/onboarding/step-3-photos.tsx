"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/property/upload-zone";
import { logger } from "@/lib/utils/logger";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface StepPhotosProps {
  property: Propiedad;
  empresaId: string;
  initialMedia: PropiedadMedia[];
}

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 50;

export function StepPhotos({ property, empresaId, initialMedia }: StepPhotosProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PropiedadMedia[]>(
    initialMedia.filter((m) => m.media_type === "photo"),
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete(id: string) {
    const previous = photos;
    setPhotos((p) => p.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setPhotos(previous);
        toast.error("Couldn't delete photo");
      }
    } catch (err) {
      logger.error("step3.delete_exception", { error: err });
      setPhotos(previous);
    }
  }

  async function handleNext() {
    if (photos.length < MIN_PHOTOS) {
      toast.error(`Upload at least ${MIN_PHOTOS} photos.`);
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`/api/property/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_step: 4 }),
      });
      logger.info("wizard.step3_complete", { propertyId: property.id, photoCount: photos.length });
      router.push(`/dashboard/property/new?id=${property.id}&step=4`);
    } finally {
      setSubmitting(false);
    }
  }

  const counterColor =
    photos.length >= MIN_PHOTOS ? "text-brand-teal" : "text-brand-muted";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Add photos of your home
        </h1>
        <p className="text-sm text-brand-muted">
          Upload at least {MIN_PHOTOS} photos. Listings with great photos sell faster.
        </p>
      </div>

      <UploadZone
        propertyId={property.id}
        empresaId={empresaId}
        bucket="listing-photos"
        mediaType="photo"
        accept="image/*"
        maxBytes={10 * 1024 * 1024}
        hint="JPG, PNG, or WEBP up to 10MB each"
        onUploaded={(m) => setPhotos((prev) => [...prev, m])}
      />

      <div className="flex items-center justify-between text-sm">
        <span className={counterColor}>
          {photos.length}/{MAX_PHOTOS} uploaded · min {MIN_PHOTOS}
        </span>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((m) => (
            <li
              key={m.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-brand-light-gray bg-brand-medium-gray stagger-item"
            >
              {m.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.public_url} alt="" className="h-full w-full object-cover" />
              ) : null}
              {m.is_hero ? (
                <span className="absolute left-2 top-2 rounded-full bg-brand-teal px-2 py-0.5 text-[10px] font-medium text-white">
                  Hero
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                aria-label="Delete photo"
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-error opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          disabled={submitting || photos.length < MIN_PHOTOS}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
