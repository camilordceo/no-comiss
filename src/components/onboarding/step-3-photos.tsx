"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/property/upload-zone";
import { PhotoGridSortable } from "@/components/property/photo-grid-sortable";
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

  const counterColor =
    photos.length >= MIN_PHOTOS ? "text-brand-teal" : "text-brand-muted";

  // Force the sortable grid to remount when photos array changes length so new
  // uploads appear without losing in-flight drag state on simple operations.
  const gridKey = useMemo(() => `grid-${photos.length}`, [photos.length]);

  function handleUploaded(media: PropiedadMedia) {
    setPhotos((prev) => [...prev, media]);
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
          Add photos of your home
        </h1>
        <p className="text-sm text-brand-muted">
          Upload at least {MIN_PHOTOS}. Drag to reorder. Click any photo to tag the room or set
          your hero.
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
        onUploaded={handleUploaded}
      />

      <div className="flex items-center justify-between text-sm">
        <span className={counterColor}>
          {photos.length}/{MAX_PHOTOS} uploaded · min {MIN_PHOTOS}
        </span>
        {photos.length > 0 && photos.length < MIN_PHOTOS ? (
          <span className="text-xs text-brand-muted">
            {MIN_PHOTOS - photos.length} more to continue
          </span>
        ) : null}
      </div>

      {photos.length > 0 ? (
        <PhotoGridSortable
          key={gridKey}
          propertyId={property.id}
          initialPhotos={photos}
        />
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
