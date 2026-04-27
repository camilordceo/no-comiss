import { redirect } from "next/navigation";
import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { ShowingsClient } from "./showings-client";
import type { Cita, Propiedad } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ShowingsPage() {
  const session = await requireDashboardSession();
  if (!session.profile.empresa_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: citasData } = await supabase
    .from("citas")
    .select("*")
    .eq("empresa_id", session.profile.empresa_id)
    .order("preferred_date", { ascending: true })
    .limit(200);

  const citas = (citasData ?? []) as Cita[];

  const propertyIds = Array.from(new Set(citas.map((c) => c.propiedad_id)));
  let propertiesById: Record<
    string,
    Pick<Propiedad, "id" | "address_line1" | "ciudad" | "state" | "slug">
  > = {};
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

  const upcoming = citas.filter(
    (c) => c.estado === "programada" || c.estado === "confirmada",
  ).length;
  const completed = citas.filter((c) => c.estado === "completada").length;

  return (
    <div className="space-y-8">
      <header>
        <div className="eyebrow eyebrow-coral mb-3">Terminal · Showings</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Showings.</span>
        </h1>
        <p className="mt-2 text-sm text-text-3 md:text-base">
          {upcoming} scheduled · {completed} completed.
        </p>
      </header>

      <ShowingsClient citas={citas} propertiesById={propertiesById} />
    </div>
  );
}
