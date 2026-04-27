import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

export interface ContentScoreBreakdown {
  total: number;
  photos: number;
  hero: number;
  rooms: number;
  videos: number;
  story: number;
  price: number;
  description: number;
}

export interface ContentScoreResult extends ContentScoreBreakdown {
  missing: ContentMissing[];
  primaryNudge: ContentMissing | null;
}

export type ContentMissing =
  | "no_video"
  | "few_photos"
  | "no_story"
  | "untagged_rooms"
  | "no_hero"
  | "no_price"
  | "no_description";

const NUDGE_PRIORITY: ContentMissing[] = [
  "no_video",
  "few_photos",
  "no_story",
  "untagged_rooms",
  "no_hero",
  "no_description",
  "no_price",
];

/**
 * Score formula (matches the PRD):
 *  - up to 50 pts for photos (10 pts each, max 5)
 *  - 5 pts hero photo set
 *  - 10 pts all photos tagged with a room
 *  - 15 pts ≥1 video uploaded
 *  - 10 pts seller story (200+ chars)
 *  - 5 pts price set
 *  - 5 pts description (≥20 chars on listing description)
 */
export function calculateContentScore(
  property: Pick<Propiedad, "precio" | "descripcion" | "seller_story">,
  media: Pick<PropiedadMedia, "media_type" | "is_hero" | "room_tag">[],
): ContentScoreResult {
  const photos = media.filter((m) => m.media_type === "photo");
  const videos = media.filter((m) => m.media_type === "video");
  const photoCount = Math.min(5, photos.length);

  const photoPoints = photoCount * 10;
  const heroPoints = photos.some((p) => p.is_hero === true) ? 5 : 0;
  const allTagged =
    photos.length > 0 && photos.every((p) => !!p.room_tag && p.room_tag.length > 0);
  const roomPoints = allTagged ? 10 : 0;
  const videoPoints = videos.length > 0 ? 15 : 0;
  const storyPoints =
    property.seller_story != null && property.seller_story.trim().length >= 200 ? 10 : 0;
  const pricePoints = property.precio != null && property.precio > 0 ? 5 : 0;
  const descPoints =
    property.descripcion != null && property.descripcion.trim().length >= 20 ? 5 : 0;

  const total = Math.min(
    100,
    photoPoints + heroPoints + roomPoints + videoPoints + storyPoints + pricePoints + descPoints,
  );

  const missing: ContentMissing[] = [];
  if (videos.length === 0) missing.push("no_video");
  if (photos.length < 10) missing.push("few_photos");
  if (storyPoints === 0) missing.push("no_story");
  if (!allTagged && photos.length > 0) missing.push("untagged_rooms");
  if (heroPoints === 0 && photos.length > 0) missing.push("no_hero");
  if (descPoints === 0) missing.push("no_description");
  if (pricePoints === 0) missing.push("no_price");

  const primaryNudge =
    NUDGE_PRIORITY.find((tag) => missing.includes(tag)) ?? null;

  return {
    total,
    photos: photoPoints,
    hero: heroPoints,
    rooms: roomPoints,
    videos: videoPoints,
    story: storyPoints,
    price: pricePoints,
    description: descPoints,
    missing,
    primaryNudge,
  };
}

interface NudgeCopy {
  eyebrow: string;
  headline: string;
  ctaLabel: string;
  ctaHref: (propertyId: string) => string;
}

export const NUDGE_COPY: Record<ContentMissing, NudgeCopy> = {
  no_video: {
    eyebrow: "✦ Boost your listing",
    headline: "Listings with video get 73% more showing requests.",
    ctaLabel: "Upload a video",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  few_photos: {
    eyebrow: "✦ Boost your listing",
    headline: "Listings with 10+ photos sell 32% faster.",
    ctaLabel: "Add more photos",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  no_story: {
    eyebrow: "✦ Boost your listing",
    headline: "Buyers connect 2× more when they hear your story.",
    ctaLabel: "Write your story",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  untagged_rooms: {
    eyebrow: "✦ Tag your rooms",
    headline: "Tagged rooms help buyers find what they love.",
    ctaLabel: "Tag photos",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  no_hero: {
    eyebrow: "✦ Pick a hero",
    headline: "A hero photo is the first thing buyers see.",
    ctaLabel: "Pick hero photo",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  no_description: {
    eyebrow: "✦ Tell the story",
    headline: "Listings with a real description get more saves.",
    ctaLabel: "Write description",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
  no_price: {
    eyebrow: "✦ Set the price",
    headline: "Add an asking price so the AI can take you live.",
    ctaLabel: "Set price",
    ctaHref: (id) => `/dashboard/property/${id}`,
  },
};

export function nextScoreTarget(score: number): { target: number; deltaLabel: string } {
  if (score >= 100) return { target: 100, deltaLabel: "You're maxed out." };
  if (score < 60) return { target: 60, deltaLabel: `Add ${60 - score} pts to reach 60.` };
  if (score < 80) return { target: 80, deltaLabel: `Add ${80 - score} pts to reach 80.` };
  return { target: 100, deltaLabel: `Add ${100 - score} pts to max out.` };
}
