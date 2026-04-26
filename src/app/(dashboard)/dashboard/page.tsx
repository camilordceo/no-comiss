import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OverviewEmptyState } from "@/components/dashboard/overview-empty-state";
import { STATUS_LABEL, STATUS_PILL_CLASS } from "@/lib/types/app";
import { formatPrice, formatRelativeDate } from "@/lib/utils/format";
import type { ListingStatus, PropiedadMedia } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

export default async function DashboardOverviewPage() {
  const session = await requireDashboardSession();

  if (!session.profile.empresa_id) {
    return <OverviewEmptyState />;
  }

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("propiedades")
    .select("*")
    .eq("empresa_id", session.profile.empresa_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const properties = listings ?? [];

  if (properties.length === 0) {
    return <OverviewEmptyState />;
  }

  const propertyIds = properties.map((p) => p.id);
  const { data: heroMedia } = await supabase
    .from("propiedad_media")
    .select("*")
    .in("propiedad_id", propertyIds)
    .eq("media_type", "photo")
    .order("sort_order", { ascending: true });

  const heroByProperty = new Map<string, PropiedadMedia>();
  for (const m of heroMedia ?? []) {
    if (!heroByProperty.has(m.propiedad_id)) {
      heroByProperty.set(m.propiedad_id, m as PropiedadMedia);
    }
    if (m.is_hero === true) {
      heroByProperty.set(m.propiedad_id, m as PropiedadMedia);
    }
  }

  const firstName = session.profile.nombre?.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="label-section mb-2">Tus inmuebles</div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Hola{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {properties.length} inmueble{properties.length === 1 ? "" : "s"} publicado
            {properties.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/property/new">
            <Plus className="h-4 w-4" /> Publicar inmueble
          </Link>
        </Button>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => {
          const hero = heroByProperty.get(p.id);
          const status = (p.listing_status ?? "draft") as ListingStatus;
          return (
            <li key={p.id} className="stagger-item">
              <Link
                href={`/dashboard/property/${p.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface-3 transition-colors duration-200 hover:border-brand-green"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
                  {hero?.public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hero.public_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8" aria-hidden />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <span className={cn("status-pill", STATUS_PILL_CLASS[status])}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {p.ubicacion ?? "Sin dirección"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[p.ciudad, p.tipo_inmueble].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-brand-green" />
                  </div>
                  <div className="mt-auto flex items-end justify-between border-t border-border-subtle pt-3">
                    <div className="text-base font-bold text-white">
                      {formatPrice(p.precio, p.currency ?? "COP")}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {formatRelativeDate(p.created_at)}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
