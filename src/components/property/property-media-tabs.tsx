"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoUploader } from "./video-uploader";
import { VideoEmptyState } from "./video-empty-state";
import type { PropiedadMedia } from "@/lib/types/database";

interface Props {
  empresaId: string;
  propertyId: string;
  photos: PropiedadMedia[];
  videos: PropiedadMedia[];
}

export function PropertyMediaTabs({ empresaId, propertyId, photos, videos: initialVideos }: Props) {
  const [videos, setVideos] = useState<PropiedadMedia[]>(initialVideos);
  const hadVideoBefore = initialVideos.length > 0;

  return (
    <Tabs defaultValue={initialVideos.length > 0 ? "photos" : "photos"}>
      <TabsList>
        <TabsTrigger value="photos">Photos · {photos.length}</TabsTrigger>
        <TabsTrigger value="videos">Videos · {videos.length}</TabsTrigger>
      </TabsList>

      <TabsContent value="photos">
        {photos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <li
                key={p.id}
                className="aspect-square overflow-hidden border border-rule bg-crema-2"
              >
                {p.public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.public_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-3">No photos yet.</p>
        )}
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
