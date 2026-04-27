import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/lib/types/database";

const patchSchema = z.object({
  address_line1: z.string().optional(),
  address_line2: z.string().nullable().optional(),
  ciudad: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  tipo_inmueble: z.string().nullable().optional(),
  tipo_negocio: z.string().nullable().optional(),
  parqueaderos: z.number().int().nullable().optional(),
  ubicacion: z.string().nullable().optional(),
  habitaciones: z.number().int().nullable().optional(),
  banos: z.number().nullable().optional(),
  sqft: z.number().int().nullable().optional(),
  lot_sqft: z.number().int().nullable().optional(),
  year_built: z.number().int().nullable().optional(),
  stories: z.number().int().nullable().optional(),
  garage_spaces: z.number().int().nullable().optional(),
  hoa_monthly: z.number().nullable().optional(),
  precio: z.number().nullable().optional(),
  seller_story: z.string().nullable().optional(),
  description_short: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  listing_status: z
    .enum(["draft", "onboarding", "ready", "active", "paused", "under_offer", "sold", "expired"])
    .optional(),
  onboarding_step: z.number().int().optional(),
});

async function authorize(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" as const, status: 401, supabase: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.empresa_id) return { error: "empresa_missing" as const, status: 400, supabase: null };

  const { data: property } = await supabase
    .from("propiedades")
    .select("id, empresa_id")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return { error: "not_found" as const, status: 404, supabase: null };
  if (property.empresa_id !== profile.empresa_id)
    return { error: "forbidden" as const, status: 403, supabase: null };
  return { error: null, status: 200, supabase, empresaId: profile.empresa_id, userId: user.id };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase!
    .from("propiedades")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    logger.error("property.get_failed", { id, message: error.message });
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const { data: media } = await auth.supabase!
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ property: data, media: media ?? [] });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updates: Database["public"]["Tables"]["propiedades"]["Update"] = { ...parsed.data };

  // Auto-stamp published_at the first time a listing flips into a public
  // status (active/under_offer/sold) so SEO/share UTM capture works.
  if (
    parsed.data.listing_status &&
    ["active", "under_offer", "sold"].includes(parsed.data.listing_status)
  ) {
    const { data: existingPub } = await auth.supabase!
      .from("propiedades")
      .select("published_at")
      .eq("id", id)
      .single();
    if (!existingPub?.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  if (
    parsed.data.address_line1 ||
    parsed.data.ciudad ||
    parsed.data.state ||
    parsed.data.zip_code
  ) {
    const { data: existing } = await auth.supabase!
      .from("propiedades")
      .select("address_line1, ciudad, state, zip_code")
      .eq("id", id)
      .single();
    const a1 = parsed.data.address_line1 ?? existing?.address_line1 ?? "";
    const c = parsed.data.ciudad ?? existing?.ciudad ?? "";
    const s = parsed.data.state ?? existing?.state ?? "";
    const z = parsed.data.zip_code ?? existing?.zip_code ?? "";
    updates.ubicacion = `${a1}, ${c}, ${s} ${z}`.trim();
  }

  const { data, error } = await auth.supabase!
    .from("propiedades")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    logger.error("property.patch_failed", { id, message: error.message });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  // If listing was just marked ready, also flip onboarding_completed on the profile.
  if (parsed.data.listing_status === "ready") {
    await auth.supabase!
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", auth.userId!);
    logger.info("property.onboarding_completed", { propertyId: id, userId: auth.userId });
  }

  logger.info("property.patched", { id, fields: Object.keys(updates) });
  return NextResponse.json({ property: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { error } = await auth.supabase!.from("propiedades").delete().eq("id", id);
  if (error) {
    logger.error("property.delete_failed", { id, message: error.message });
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  logger.info("property.deleted", { id });
  return NextResponse.json({ success: true });
}
