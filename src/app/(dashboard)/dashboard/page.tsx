import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OverviewEmptyState } from "@/components/dashboard/overview-empty-state";
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from "@/lib/types/app";
import { formatPrice, formatRelativeDate, propertyTypeLabel } from "@/lib/utils/format";
import type { ListingStatus, PropiedadMedia } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";

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
  const totalListings = properties.length;
  const liveCount = properties.filter((p) => p.listing_status === "active").length;
  const totalSavings = properties.reduce(
    (acc, p) => acc + Math.round(((p.precio ?? 0) * 0.06)),
    0,
  );

  return (
    <div className="space-y-12">
      {/* ─────────────── Page header ─────────────── */}
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow eyebrow-coral mb-3">Terminal · Overview</div>
          <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
            <span className="italic">Welcome back{firstName ? `, ${firstName}` : ""}.</span>
          </h1>
          <p className="mt-2 text-sm text-text-3 md:text-base">
            {totalListings} listing{totalListings === 1 ? "" : "s"}
            {liveCount > 0 ? ` · ${liveCount} live` : ""}.
          </p>
        </div>
        <Button asChild variant="spark">
          <Link href="/dashboard/property/new">
            <Plus className="h-3.5 w-3.5" /> List a home
          </Link>
        </Button>
      </header>

      {/* ─────────────── Stat tiles ─────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-tile">
          <div className="data-key">Active leads</div>
          <div className="stat-value mt-2">0</div>
          <div className="mt-2 text-xs text-text-3">First leads in ~48h</div>
        </div>
        <div className="stat-tile stat-tile-spark">
          <div className="data-key" style={{ color: "var(--coral)" }}>
            Potential savings
          </div>
          <div className="stat-value mt-2">{formatPrice(totalSavings)}</div>
          <div className="mt-2 text-xs text-text-3">vs. 6% commission</div>
        </div>
        <div className="stat-tile">
          <div className="data-key">Listing views</div>
          <div className="stat-value mt-2">0</div>
          <div className="mt-2 text-xs text-text-3">Across all channels</div>
        </div>
        <div className="stat-tile">
          <div className="data-key">Days live</div>
          <div className="stat-value mt-2">
            {properties[0]?.published_at
              ? Math.max(
                  1,
                  Math.floor(
                    (Date.now() - new Date(properties[0].published_at).getTime()) /
                      86_400_000,
                  ),
                )
              : 0}
          </div>
          <div className="mt-2 text-xs text-text-3">Since first publish</div>
        </div>
      </section>

      {/* ─────────────── Listings grid ─────────────── */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="eyebrow">Your listings</div>
            <h2 className="mt-2 font-serif text-2xl font-medium leading-tight text-text">
              Properties on the market.
            </h2>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const hero = heroByProperty.get(p.id);
            const status = (p.listing_status ?? "draft") as ListingStatus;
            const variant = STATUS_BADGE_VARIANT[status];
            return (
              <li key={p.id}>
                <Link
                  href={`/dashboard/property/${p.id}`}
                  className="group block h-full overflow-hidden border border-rule bg-ivory hover-lift"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden stripe-pattern">
                    {hero?.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hero.public_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-180 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-3">
                        <Building2 className="h-8 w-8" aria-hidden />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
                    </div>
                  </div>
                  <div className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-serif text-lg font-medium leading-tight text-text">
                          {p.address_line1 ?? p.ubicacion ?? "Untitled"}
                        </div>
                        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                          {[p.ciudad, p.state].filter(Boolean).join(", ")}
                          {p.tipo_inmueble
                            ? ` · ${propertyTypeLabel(p.tipo_inmueble)}`
                            : ""}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-3 transition-all group-hover:translate-x-0.5 group-hover:text-coral" />
                    </div>
                    <div className="mt-auto flex items-end justify-between border-t border-rule pt-3">
                      <div className="font-serif text-xl font-medium text-text">
                        {formatPrice(p.precio, p.currency ?? "USD")}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                        {formatRelativeDate(p.created_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ─────────────── AI Insight block ─────────────── */}
      <section className="border border-espresso bg-espresso p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <div>
            <div className="eyebrow text-coral">✦ AI Insight</div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium italic leading-snug text-text-on-dark md:text-3xl">
              {liveCount > 0
                ? "Your listings are live. Add a video tour to close 2× faster."
                : "Add at least 5 photos and the AI will start running ads in 24 hours."}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-on-dark-2">
              The Terminal screens leads, answers buyer questions, and adjusts
              creative based on engagement. You handle showings — we handle
              everything else.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
