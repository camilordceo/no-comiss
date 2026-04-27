import { redirect } from "next/navigation";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { LeadsClient } from "./leads-client";
import type { Lead, Propiedad } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await requireDashboardSession();
  if (!session.profile.empresa_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: leadsData } = await supabase
    .from("leads")
    .select("*")
    .eq("empresa_id", session.profile.empresa_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const leads = (leadsData ?? []) as Lead[];

  const propertyIds = Array.from(
    new Set(leads.map((l) => l.propiedad_interes_id).filter(Boolean) as string[]),
  );
  let propertiesById: Record<string, Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug">> = {};
  if (propertyIds.length > 0) {
    const { data: props } = await supabase
      .from("propiedades")
      .select("id, address_line1, ciudad, state, slug")
      .in("id", propertyIds);
    propertiesById = Object.fromEntries(
      (props ?? []).map((p) => [
        p.id,
        p as Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug">,
      ]),
    );
  }

  const total = leads.length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length;

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow eyebrow-coral mb-3">Terminal · Leads</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Interested people.</span>
        </h1>
        <p className="mt-2 text-sm text-text-3 md:text-base">
          {total} total{total > 0 ? ` · ${thisWeek} this week` : ""}.
        </p>
      </header>

      <LeadsClient leads={leads} propertiesById={propertiesById} />
    </div>
  );
}
