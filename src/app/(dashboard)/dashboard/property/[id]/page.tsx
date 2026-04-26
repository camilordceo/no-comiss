import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bath, BedDouble, Building2, Car, Ruler } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { STATUS_LABEL, STATUS_PILL_CLASS } from "@/lib/types/app";
import { formatArea, formatPrice, formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
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
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver
        </Link>
      </div>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <span className={cn("status-pill", STATUS_PILL_CLASS[status])}>
            {STATUS_LABEL[status]}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {property.ubicacion ?? "Sin dirección"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {[property.ciudad, property.tipo_inmueble, property.tipo_negocio]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <div className="label-form">Precio</div>
          <div className="text-2xl font-bold text-white">
            {formatPrice(property.precio, property.currency ?? "COP")}
          </div>
        </div>
      </header>

      {/* Hero photo */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface-3">
        <div className="aspect-[16/9] w-full bg-surface-2">
          {hero?.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.public_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Building2 className="h-10 w-10" aria-hidden />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={BedDouble} label="Habitaciones" value={property.habitaciones ?? "—"} />
        <Stat icon={Bath} label="Baños" value={property.banos ?? "—"} />
        <Stat icon={Car} label="Parqueaderos" value={property.parqueaderos ?? "—"} />
        <Stat icon={Ruler} label="Área" value={formatArea(property.sqft)} />
      </div>

      {/* Description */}
      {property.descripcion ? (
        <section className="rounded-lg border border-border bg-surface-3 p-5">
          <h2 className="label-section mb-3">Descripción</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {property.descripcion}
          </p>
        </section>
      ) : null}

      {/* Photo grid */}
      {photos.length > 1 ? (
        <section className="space-y-3">
          <h2 className="label-section">Galería · {photos.length} fotos</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <li
                key={p.id}
                className="aspect-square overflow-hidden rounded-md border border-border bg-surface-2"
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

      <footer className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Publicado {formatRelativeDate(property.created_at)}
          {property.slug ? (
            <>
              {" · "}
              <code className="rounded-sm bg-surface-3 px-1.5 py-0.5">
                {property.slug}
              </code>
            </>
          ) : null}
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Volver al listado</Link>
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
    <div className="rounded-md border border-border bg-surface-3 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
    </div>
  );
}
