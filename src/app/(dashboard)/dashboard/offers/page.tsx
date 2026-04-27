import { redirect } from "next/navigation";
import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { OffersClient } from "./offers-client";
import type { Oferta, Propiedad } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const session = await requireDashboardSession();
  if (!session.profile.empresa_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: ofertasData } = await supabase
    .from("ofertas")
    .select("*")
    .eq("empresa_id", session.profile.empresa_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const ofertas = (ofertasData ?? []) as Oferta[];

  const propertyIds = Array.from(new Set(ofertas.map((o) => o.propiedad_id)));
  let propertiesById: Record<
    string,
    Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug" | "precio">
  > = {};
  if (propertyIds.length > 0) {
    const { data: props } = await supabase
      .from("propiedades")
      .select("id, address_line1, ciudad, state, slug, precio")
      .in("id", propertyIds);
    propertiesById = Object.fromEntries(
      (props ?? []).map((p) => [
        p.id,
        p as Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug" | "precio">,
      ]),
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow eyebrow-coral mb-3">Terminal · Offers</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Offers.</span>
        </h1>
        <p className="mt-2 text-sm text-text-3 md:text-base">
          {ofertas.length} received.
        </p>
      </header>

      <OffersClient ofertas={ofertas} propertiesById={propertiesById} />
    </div>
  );
}
