/**
 * Allowed MIME types per media kind.
 * Reject anything outside the whitelist — we don't want random binaries
 * landing in our public storage buckets.
 */
const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_MIME = new Set([
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
  "video/x-m4v",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!IMAGE_MIME.has(file.type)) {
    return { valid: false, error: "Use JPG, PNG, WebP, or GIF" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: "Image must be under 10MB" };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): ValidationResult {
  if (!VIDEO_MIME.has(file.type)) {
    return { valid: false, error: "Use MP4, MOV, or WebM" };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { valid: false, error: "Video must be under 500MB" };
  }
  return { valid: true };
}

export function validateAvatarFile(file: File): ValidationResult {
  if (!IMAGE_MIME.has(file.type)) {
    return { valid: false, error: "Use JPG, PNG, or WebP" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { valid: false, error: "Avatar must be under 2MB" };
  }
  return { valid: true };
}

export const FILE_LIMITS = {
  image: MAX_IMAGE_BYTES,
  video: MAX_VIDEO_BYTES,
  avatar: MAX_AVATAR_BYTES,
} as const;
