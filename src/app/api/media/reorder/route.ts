import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const reorderSchema = z.object({
  propiedad_id: z.string().uuid(),
  order: z.array(z.string().uuid()).min(1),
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
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("empresa_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.empresa_id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: prop } = await supabase
    .from("propiedades")
    .select("id, empresa_id")
    .eq("id", parsed.data.propiedad_id)
    .maybeSingle();
  if (!prop || prop.empresa_id !== profile.empresa_id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Update sort_order in batch.
  await Promise.all(
    parsed.data.order.map((mediaId, index) =>
      supabase
        .from("propiedad_media")
        .update({ sort_order: index })
        .eq("id", mediaId)
        .eq("propiedad_id", parsed.data.propiedad_id),
    ),
  );

  logger.info("media.reordered", {
    propertyId: parsed.data.propiedad_id,
    count: parsed.data.order.length,
  });
  return NextResponse.json({ success: true });
}
