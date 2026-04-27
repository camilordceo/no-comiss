import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const patchSchema = z.object({
  status: z
    .enum(["new", "contacted", "qualified", "showing", "offer", "won", "lost"])
    .optional(),
  seller_notes: z.string().trim().max(4000).nullable().optional(),
});

async function authorize(leadId: string) {
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

  const { data: lead } = await supabase
    .from("leads")
    .select("id, empresa_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "not_found" as const, status: 404, supabase: null };
  if (lead.empresa_id !== profile.empresa_id)
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

  const { data, error } = await auth.supabase!
    .from("leads")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    logger.error("lead.patch_failed", { id, message: error.message });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  logger.info("lead.patched", { id, fields: Object.keys(parsed.data) });
  return NextResponse.json({ lead: data });
}
