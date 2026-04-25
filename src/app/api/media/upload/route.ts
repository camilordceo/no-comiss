import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const insertSchema = z.object({
  propiedad_id: z.string().uuid(),
  media_type: z.enum(["photo", "video", "virtual_tour"]),
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  thumbnail_url: z.string().url().optional().nullable(),
  room_tag: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  file_size_bytes: z.number().int().nonnegative().optional().nullable(),
  mime_type: z.string().optional().nullable(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
});

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

  const parsed = insertSchema.safeParse(body);
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
    return NextResponse.json({ error: "empresa_missing" }, { status: 400 });
  }

  const { data: property } = await supabase
    .from("propiedades")
    .select("id, empresa_id")
    .eq("id", parsed.data.propiedad_id)
    .maybeSingle();
  if (!property || property.empresa_id !== profile.empresa_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Determine next sort_order and whether to auto-flag as hero.
  const { data: existing } = await supabase
    .from("propiedad_media")
    .select("sort_order, media_type, is_hero")
    .eq("propiedad_id", parsed.data.propiedad_id);

  const sameType = (existing ?? []).filter((m) => m.media_type === parsed.data.media_type);
  const nextSort = sameType.reduce(
    (acc, m) => Math.max(acc, (m.sort_order ?? 0) + 1),
    0,
  );
  const isFirstPhoto =
    parsed.data.media_type === "photo" &&
    !sameType.some((m) => m.is_hero === true) &&
    sameType.length === 0;

  const { data, error } = await supabase
    .from("propiedad_media")
    .insert({
      ...parsed.data,
      empresa_id: profile.empresa_id,
      uploaded_by: user.id,
      sort_order: nextSort,
      is_hero: isFirstPhoto,
    })
    .select("*")
    .single();

  if (error) {
    logger.error("media.insert_failed", { message: error.message });
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  logger.info("media.uploaded", {
    propertyId: parsed.data.propiedad_id,
    type: parsed.data.media_type,
    mediaId: data.id,
  });
  return NextResponse.json({ media: data });
}
