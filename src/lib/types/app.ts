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

export const ONBOARDING_STEPS = [
  { id: 1, key: "address", label: "Address" },
  { id: 2, key: "details", label: "Details" },
  { id: 3, key: "photos", label: "Photos" },
  { id: 4, key: "videos", label: "Videos" },
  { id: 5, key: "story", label: "Story" },
  { id: 6, key: "review", label: "Review" },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

export const STATUS_LABEL: Record<ListingStatus, string> = {
  draft: "Draft",
  onboarding: "Setup in progress",
  ready: "Ready to publish",
  active: "Live",
  paused: "Paused",
  under_offer: "Under offer",
  sold: "Sold",
  expired: "Expired",
};

export const STATUS_COLOR: Record<ListingStatus, string> = {
  draft: "bg-brand-medium-gray text-brand-muted",
  onboarding: "bg-brand-medium-gray text-brand-black",
  ready: "bg-brand-mint/30 text-brand-black",
  active: "bg-brand-teal text-white",
  paused: "bg-warning/15 text-warning",
  under_offer: "bg-info/15 text-info",
  sold: "bg-brand-black text-white",
  expired: "bg-error/15 text-error",
};
