import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/utils/validation";
import { buildListingSlug } from "@/lib/utils/slugify";
import { logger } from "@/lib/utils/logger";

const createSchema = addressSchema;

/** POST /api/property — create a draft listing for the seller's empresa. */
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

  const parsed = createSchema.safeParse(body);
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

  const { address_line1, address_line2, ciudad, state, zip_code } = parsed.data;
  const slugBase = buildListingSlug(address_line1, ciudad, state);
  const slug = `${slugBase}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("propiedades")
    .insert({
      empresa_id: profile.empresa_id,
      source: "nocomiss",
      country: "US",
      currency: "USD",
      tipo_negocio: "venta",
      address_line1,
      address_line2: address_line2 || null,
      ciudad,
      state,
      zip_code,
      ubicacion: `${address_line1}, ${ciudad}, ${state} ${zip_code}`,
      slug,
      listing_status: "onboarding",
      onboarding_step: 2,
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
