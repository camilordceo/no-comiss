import type { Profile, Empresa, Propiedad, PropiedadMedia, ListingStatus } from "./database";

export type { Profile, Empresa, Propiedad, PropiedadMedia, ListingStatus };

export interface PropertyWithMedia extends Propiedad {
  media: PropiedadMedia[];
  hero?: PropiedadMedia | null;
}

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
  empresa: Empresa | null;
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  draft: "Draft",
  onboarding: "In setup",
  ready: "Ready",
  active: "Live",
  paused: "Paused",
  under_offer: "Under offer",
  sold: "Sold",
  expired: "Expired",
};

export const STATUS_BADGE_VARIANT: Record<
  ListingStatus,
  "draft" | "ready" | "active" | "paused" | "sold" | "warning" | "info"
> = {
  draft: "draft",
  onboarding: "warning",
  ready: "ready",
  active: "active",
  paused: "paused",
  under_offer: "info",
  sold: "sold",
  expired: "paused",
};
