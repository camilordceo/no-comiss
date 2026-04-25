import { redirect } from "next/navigation";
import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { WizardClient } from "./wizard-client";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

interface PageProps {
  searchParams: Promise<{ id?: string; step?: string }>;
}

export const dynamic = "force-dynamic";

export default async function PropertyOnboardingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await requireDashboardSession();

  if (!session.profile.empresa_id) {
    redirect("/dashboard");
  }

  let property: Propiedad | null = null;
  let media: PropiedadMedia[] = [];

  if (params.id) {
    const supabase = await createClient();
    const [{ data: prop }, { data: med }] = await Promise.all([
      supabase
        .from("propiedades")
        .select("*")
        .eq("id", params.id)
        .eq("empresa_id", session.profile.empresa_id)
        .maybeSingle(),
      supabase
        .from("propiedad_media")
        .select("*")
        .eq("propiedad_id", params.id)
        .order("sort_order", { ascending: true }),
    ]);
    property = prop;
    media = med ?? [];
  } else if (session.primaryProperty?.listing_status === "onboarding") {
    // Resume in-progress onboarding from the most recent draft.
    const supabase = await createClient();
    property = session.primaryProperty;
    const { data: med } = await supabase
      .from("propiedad_media")
      .select("*")
      .eq("propiedad_id", property.id)
      .order("sort_order", { ascending: true });
    media = med ?? [];
  }

  let step = Number(params.step ?? property?.onboarding_step ?? 1);
  if (!Number.isFinite(step) || step < 1) step = 1;
  if (step > 6) step = 6;
  if (!property && step > 1) step = 1;

  return (
    <WizardClient
      step={step}
      property={property}
      empresaId={session.profile.empresa_id}
      media={media}
    />
  );
}
