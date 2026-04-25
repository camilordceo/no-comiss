import Link from "next/link";
import { ArrowRight, Camera, MapPin, Pencil } from "lucide-react";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL } from "@/lib/types/app";
import { formatPrice, formatSqft } from "@/lib/utils/format";

interface PropertyStatusCardProps {
  property: Propiedad;
  hero: PropiedadMedia | null;
  photoCount: number;
}

function statusBadgeVariant(status: Propiedad["listing_status"]) {
  switch (status) {
    case "active":
      return "default" as const;
    case "ready":
      return "success" as const;
    case "sold":
    case "expired":
      return "secondary" as const;
    case "paused":
      return "warning" as const;
    case "under_offer":
      return "info" as const;
    default:
      return "secondary" as const;
  }
}

export function PropertyStatusCard({ property, hero, photoCount }: PropertyStatusCardProps) {
  const status = property.listing_status ?? "draft";
  const isOnboarding = status === "onboarding" || status === "draft";
  const editHref = isOnboarding
    ? `/dashboard/property/new?id=${property.id}`
    : `/dashboard/property/${property.id}`;

  const addressLine = property.address_line1
    ? `${property.address_line1}${property.address_line2 ? `, ${property.address_line2}` : ""}`
    : "Address not yet set";
  const cityLine =
    property.ciudad && property.state
      ? `${property.ciudad}, ${property.state} ${property.zip_code ?? ""}`.trim()
      : "—";

  return (
    <div className="overflow-hidden rounded-lg border border-brand-light-gray bg-white shadow-sm card-hover">
      <div className="relative aspect-[16/9] w-full bg-brand-medium-gray">
        {hero?.public_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.public_url}
            alt={property.address_line1 ?? "Property hero"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-brand-muted">
            <Camera className="mr-2 h-4 w-4" aria-hidden />
            No photos yet
          </div>
        )}
        <div className="absolute left-4 top-4">
          <Badge variant={statusBadgeVariant(status)}>{STATUS_LABEL[status]}</Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-medium tracking-tight text-brand-black">{addressLine}</h2>
            <div className="flex items-center gap-1 text-sm text-brand-muted">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {cityLine}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link href={editHref}>
                <Pencil className="h-4 w-4" /> {isOnboarding ? "Continue setup" : "Edit"}
              </Link>
            </Button>
            {!isOnboarding ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/property/${property.id}/photos`}>
                  Manage photos <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-brand-light-gray pt-6 sm:grid-cols-4">
          <Stat label="Price" value={formatPrice(property.precio, property.currency ?? "USD")} />
          <Stat label="Beds" value={property.habitaciones ?? "—"} />
          <Stat label="Baths" value={property.banos ?? "—"} />
          <Stat label="Size" value={formatSqft(property.sqft)} />
        </div>

        <div className="mt-4 text-xs text-brand-muted">
          {photoCount} photo{photoCount === 1 ? "" : "s"} uploaded
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-brand-muted">{label}</div>
      <div className="mt-1 text-base font-medium text-brand-black">{value}</div>
    </div>
  );
}
