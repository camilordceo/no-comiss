import { Eye, Heart, MessageSquare } from "lucide-react";
import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { OverviewEmptyState } from "@/components/dashboard/overview-empty-state";
import { PropertyStatusCard } from "@/components/dashboard/property-status-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import type { PropiedadMedia } from "@/lib/types/database";

export default async function DashboardOverviewPage() {
  const session = await requireDashboardSession();
  const property = session.primaryProperty;

  if (!property) {
    return <OverviewEmptyState />;
  }

  const supabase = await createClient();
  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", property.id)
    .order("sort_order", { ascending: true });

  const photos = (media ?? []).filter((m) => m.media_type === "photo") as PropiedadMedia[];
  const hero =
    photos.find((m) => m.is_hero === true) ??
    photos[0] ??
    null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-brand-black">
          Hi{session.profile.nombre ? `, ${session.profile.nombre.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-brand-muted">Here&apos;s where your listing stands.</p>
      </div>

      <PropertyStatusCard property={property} hero={hero} photoCount={photos.length} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Views" value={0} icon={Eye} trend="Track once published" />
        <MetricCard label="Interested buyers" value={0} icon={Heart} />
        <MetricCard label="Messages" value={0} icon={MessageSquare} />
      </div>
    </div>
  );
}
