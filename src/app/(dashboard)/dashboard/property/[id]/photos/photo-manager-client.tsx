"use client";

import { useState } from "react";

import { UploadZone } from "@/components/property/upload-zone";
import { PhotoGridSortable } from "@/components/property/photo-grid-sortable";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface PhotoManagerClientProps {
  property: Propiedad;
  empresaId: string;
  initialPhotos: PropiedadMedia[];
}

export function PhotoManagerClient({
  property,
  empresaId,
  initialPhotos,
}: PhotoManagerClientProps) {
  const [photos, setPhotos] = useState<PropiedadMedia[]>(initialPhotos);

  function handleUploaded(media: PropiedadMedia) {
    setPhotos((prev) => [...prev, media]);
  }

  return (
    <div className="space-y-6">
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

      <PhotoGridSortable
        key={photos.length}
        propertyId={property.id}
        initialPhotos={photos}
      />
    </div>
  );
}
