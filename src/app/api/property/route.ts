import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/utils/validation";
import { buildListingSlug } from "@/lib/utils/slugify";
import { logger } from "@/lib/utils/logger";

/** POST /api/property — create a complete listing in one shot. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.empresa_id) {
    logger.error("property.create_no_empresa", { userId: user.id });
    return NextResponse.json({ error: "empresa_missing" }, { status: 400 });
  }

  const d = parsed.data;
  const slugBase = buildListingSlug(d.ubicacion, d.ciudad, d.tipo_negocio);
  const stamp = Date.now().toString(36);
  const slug = `${slugBase}-${stamp}`;
  const codigo = `RM-${stamp.toUpperCase()}`;

  const { data, error } = await supabase
    .from("propiedades")
    .insert({
      empresa_id: profile.empresa_id,
      codigo,
      source: "rentmies",
      country: "CO",
      currency: "COP",
      tipo_negocio: d.tipo_negocio,
      tipo_inmueble: d.tipo_inmueble,
      ciudad: d.ciudad,
      ubicacion: d.ubicacion,
      habitaciones: d.habitaciones,
      banos: d.banos,
      parqueaderos: d.parqueaderos,
      sqft: d.area_m2,
      precio: d.precio,
      descripcion: d.descripcion,
      slug,
      listing_status: "draft",
      onboarding_step: 0,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("property.create_failed", { message: error.message });
    return NextResponse.json({ error: "create_failed", message: error.message }, { status: 500 });
  }

  logger.info("property.created", { propertyId: data.id, empresaId: profile.empresa_id });
  return NextResponse.json({ property: data });
}
