import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mediaUpdateSchema } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

async function authorize(mediaId: string) {
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
  if (!profile?.empresa_id) return { error: "forbidden" as const, status: 403, supabase: null };

  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();
  if (!media) return { error: "not_found" as const, status: 404, supabase: null };
  if (media.empresa_id !== profile.empresa_id)
    return { error: "forbidden" as const, status: 403, supabase: null };
  return { error: null, status: 200, supabase, media };
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

  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // If marking as hero, unset hero on siblings of same property/type.
  if (parsed.data.is_hero === true) {
    await auth.supabase!
      .from("propiedad_media")
      .update({ is_hero: false })
      .eq("propiedad_id", auth.media!.propiedad_id)
      .eq("media_type", auth.media!.media_type);
  }

  const { data, error } = await auth.supabase!
    .from("propiedad_media")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    logger.error("media.update_failed", { id, message: error.message });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  logger.info("media.updated", { id, fields: Object.keys(parsed.data) });
  return NextResponse.json({ media: data });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const auth = await authorize(id);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const bucket = auth.media!.media_type === "video" ? "listing-videos" : "listing-photos";
  const { error: storageErr } = await auth.supabase!.storage
    .from(bucket)
    .remove([auth.media!.storage_path]);
  if (storageErr) {
    logger.warn("media.storage_delete_failed", {
      id,
      path: auth.media!.storage_path,
      message: storageErr.message,
    });
  }

  const { error } = await auth.supabase!.from("propiedad_media").delete().eq("id", id);
  if (error) {
    logger.error("media.delete_failed", { id, message: error.message });
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
  logger.info("media.deleted", { id });
  return NextResponse.json({ success: true });
}
