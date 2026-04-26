import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Building2, Car, Ruler } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from "@/lib/types/app";
import {
  formatPrice,
  formatRelativeDate,
  formatSqft,
  propertyTypeLabel,
} from "@/lib/utils/format";
import type { ListingStatus } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireDashboardSession();
  if (!session.profile.empresa_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("propiedades")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", session.profile.empresa_id)
    .maybeSingle();

  if (!property) notFound();

  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", id)
    .order("sort_order", { ascending: true });

  const photos = (media ?? []).filter((m) => m.media_type === "photo");
  const hero = photos.find((m) => m.is_hero) ?? photos[0] ?? null;
  const status = (property.listing_status ?? "draft") as ListingStatus;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3 transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Back to terminal
        </Link>
      </div>

      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
            {property.codigo ? (
              <span className="data-key">{property.codigo}</span>
            ) : null}
          </div>
          <h1 className="font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
            {property.address_line1 ?? property.ubicacion ?? "Untitled listing"}
          </h1>
          <p className="text-sm text-text-3 md:text-base">
            {[property.ciudad, property.state, property.zip_code]
              .filter(Boolean)
              .join(", ")}
            {property.tipo_inmueble
              ? ` · ${propertyTypeLabel(property.tipo_inmueble)}`
              : ""}
          </p>
        </div>
        <div className="text-left md:text-right">
          <div className="data-key">Asking price</div>
          <div className="font-serif text-3xl font-medium leading-none text-text md:text-4xl">
            {formatPrice(property.precio, property.currency ?? "USD")}
          </div>
        </div>
      </header>

      {/* Hero photo */}
      <div className="overflow-hidden border border-rule bg-ivory">
        <div className="aspect-[16/9] w-full stripe-pattern">
          {hero?.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.public_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-3">
              <Building2 className="h-10 w-10" aria-hidden />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={BedDouble} label="Beds" value={property.habitaciones ?? "—"} />
        <Stat icon={Bath} label="Baths" value={property.banos ?? "—"} />
        <Stat
          icon={Car}
          label="Garage"
          value={property.garage_spaces ?? property.parqueaderos ?? "—"}
        />
        <Stat icon={Ruler} label="Size" value={formatSqft(property.sqft)} />
      </div>

      {/* Description */}
      {property.descripcion ? (
        <section className="border border-rule bg-ivory p-7">
          <div className="eyebrow mb-3">The story</div>
          <p className="font-serif text-lg leading-relaxed text-text-2">
            {property.descripcion}
          </p>
        </section>
      ) : null}

      {/* Photo grid */}
      {photos.length > 1 ? (
        <section className="space-y-3">
          <div className="eyebrow">Gallery · {photos.length} photos</div>
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
        </section>
      ) : null}

      <footer className="flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-text-3">
          Created {formatRelativeDate(property.created_at)}
          {property.slug ? (
            <>
              {" · "}
              <code className="rounded-sm bg-ivory px-1.5 py-0.5 font-mono text-[10px]">
                {property.slug}
              </code>
            </>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back to terminal</Link>
        </Button>
      </footer>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BedDouble;
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat-tile">
      <div className="flex items-center justify-between">
        <div className="data-key">{label}</div>
        <Icon className="h-3.5 w-3.5 text-text-3" aria-hidden />
      </div>
      <div className="stat-value mt-2 text-3xl">{value}</div>
    </div>
  );
}
