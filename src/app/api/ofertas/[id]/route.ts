import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { Json } from "@/lib/types/database";

const patchSchema = z.object({
  estado: z
    .enum(["submitted", "reviewed", "accepted", "countered", "rejected", "withdrawn"])
    .optional(),
  notas: z.string().trim().max(2000).nullable().optional(),
  metadata: z.unknown().optional(),
});

async function authorize(ofertaId: string) {
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
  if (!profile?.empresa_id)
    return { error: "empresa_missing" as const, status: 400, supabase: null };

  const { data: oferta } = await supabase
    .from("ofertas")
    .select("id, empresa_id")
    .eq("id", ofertaId)
    .maybeSingle();
  if (!oferta) return { error: "not_found" as const, status: 404, supabase: null };
  if (oferta.empresa_id !== profile.empresa_id)
    return { error: "forbidden" as const, status: 403, supabase: null };
  return { error: null, status: 200, supabase };
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

  const updates = {
    ...parsed.data,
    metadata: parsed.data.metadata as Json | undefined,
  };

  const { data, error } = await auth.supabase!
    .from("ofertas")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    logger.error("oferta.patch_failed", { id, message: error.message });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  logger.info("oferta.patched", { id, fields: Object.keys(parsed.data) });
  return NextResponse.json({ oferta: data });
}
