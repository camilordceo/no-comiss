"use client";

import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

export type StorageBucket = "listing-photos" | "listing-videos" | "avatars";

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateStoragePath(
  empresaId: string,
  propertyId: string,
  filename: string,
): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  return `${empresaId}/${propertyId}/${uniqueId()}.${ext}`;
}

/**
 * Upload a single file to a Supabase Storage bucket and return the public URL.
 * Throws on failure with a friendly message; logs structured events either way.
 */
export async function uploadFile(
  file: File,
  bucket: StorageBucket,
  path: string,
): Promise<UploadResult> {
  const supabase = createClient();
  logger.info("storage.upload_start", {
    bucket,
    path,
    size: file.size,
    mime: file.type,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    logger.error("storage.upload_failed", { bucket, path, message: error.message });
    throw new Error(error.message || "Upload failed");
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  logger.info("storage.upload_success", { bucket, path });
  return { storagePath: path, publicUrl: data.publicUrl };
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    logger.warn("storage.delete_failed", { bucket, path, message: error.message });
    throw new Error(error.message);
  }
  logger.info("storage.delete_success", { bucket, path });
}
