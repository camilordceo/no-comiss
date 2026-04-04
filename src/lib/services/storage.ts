import { createClient } from "@/lib/supabase/server";

export const BUCKETS = {
  LISTING_PHOTOS: "listing-photos",
  LISTING_VIDEOS: "listing-videos",
  AD_CREATIVES: "ad-creatives",
  DOCUMENTS: "documents",
} as const;

/**
 * Upload a listing photo to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadListingPhoto(
  file: File,
  listingId: string
): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKETS.LISTING_PHOTOS)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return getPublicUrl(BUCKETS.LISTING_PHOTOS, path);
}

/**
 * Upload a listing video to Supabase Storage.
 * Returns the public URL.
 */
export async function uploadVideo(
  file: File,
  listingId: string
): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${listingId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKETS.LISTING_VIDEOS)
    .upload(path, file, {
      contentType: file.type || "video/mp4",
      upsert: false,
    });

  if (error) throw new Error(`Video upload failed: ${error.message}`);

  return getPublicUrl(BUCKETS.LISTING_VIDEOS, path);
}

/**
 * Upload a Buffer (e.g. from AI-generated image) to a given bucket.
 * Returns the public URL.
 */
export async function uploadBuffer(
  buffer: Buffer,
  bucket: string,
  path: string,
  contentType = "image/jpeg"
): Promise<string> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Buffer upload failed: ${error.message}`);

  return getPublicUrl(bucket, path);
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(bucket: string, path: string): string {
  // Build the URL directly — no need for a server client just for a URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Get a URL with Supabase image transform parameters for thumbnails.
 * Supabase Storage supports: width, height, resize (cover|contain|fill)
 */
export function getThumbnailUrl(
  url: string,
  width: number,
  height: number,
  resize: "cover" | "contain" | "fill" = "cover"
): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}width=${width}&height=${height}&resize=${resize}`;
}
