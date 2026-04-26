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
  draft: "Borrador",
  onboarding: "En proceso",
  ready: "Listo para publicar",
  active: "Publicado",
  paused: "Pausado",
  under_offer: "En negociación",
  sold: "Cerrado",
  expired: "Vencido",
};

export const STATUS_PILL_CLASS: Record<ListingStatus, string> = {
  draft: "status-draft",
  onboarding: "status-warning",
  ready: "status-warning",
  active: "status-active",
  paused: "status-paused",
  under_offer: "status-active",
  sold: "status-draft",
  expired: "status-paused",
};
