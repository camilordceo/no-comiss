"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoUploader } from "./video-uploader";
import { VideoEmptyState } from "./video-empty-state";
import { PhotoUploader } from "./photo-uploader";
import type { PropiedadMedia } from "@/lib/types/database";

interface Props {
  empresaId: string;
  propertyId: string;
  photos: PropiedadMedia[];
  videos: PropiedadMedia[];
}

export function PropertyMediaTabs({
  empresaId,
  propertyId,
  photos: initialPhotos,
  videos: initialVideos,
}: Props) {
  const [photos, setPhotos] = useState<PropiedadMedia[]>(initialPhotos);
  const [videos, setVideos] = useState<PropiedadMedia[]>(initialVideos);
  const hadVideoBefore = initialVideos.length > 0;

  return (
    <Tabs defaultValue="photos">
      <TabsList>
        <TabsTrigger value="photos">Photos · {photos.length}</TabsTrigger>
        <TabsTrigger value="videos">Videos · {videos.length}</TabsTrigger>
      </TabsList>

      <TabsContent value="photos">
        <PhotoUploader
          empresaId={empresaId}
          propertyId={propertyId}
          initialPhotos={photos}
          onChange={setPhotos}
        />
      </TabsContent>

      <TabsContent value="videos">
        <div className="space-y-6">
          {videos.length === 0 ? <VideoEmptyState /> : null}
          <VideoUploader
            empresaId={empresaId}
            propertyId={propertyId}
            initialVideos={videos}
            hadVideoBefore={hadVideoBefore}
            onChange={setVideos}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
