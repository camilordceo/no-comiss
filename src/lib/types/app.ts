import type {
  Profile,
  Empresa,
  Propiedad,
  PropiedadMedia,
  ListingStatus,
  LeadStatus,
  CitaEstado,
  OfertaEstado,
} from "./database";

export type {
  Profile,
  Empresa,
  Propiedad,
  PropiedadMedia,
  ListingStatus,
  LeadStatus,
  CitaEstado,
  OfertaEstado,
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  showing: "Showing",
  offer: "Offer",
  won: "Won",
  lost: "Lost",
};

export const LEAD_STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "ready" | "active" | "warning" | "sold" | "destructive"> = {
  new: "active",
  contacted: "warning",
  qualified: "ready",
  showing: "ready",
  offer: "default",
  won: "sold",
  lost: "destructive",
};

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "showing",
  "offer",
  "won",
  "lost",
];

export const CITA_LABEL: Record<CitaEstado, string> = {
  programada: "Requested",
  confirmada: "Confirmed",
  cancelada: "Cancelled",
  completada: "Completed",
};

export const OFERTA_LABEL: Record<OfertaEstado, string> = {
  submitted: "Submitted",
  reviewed: "Reviewed",
  accepted: "Accepted",
  countered: "Countered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

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
