import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
});

/** PATCH /api/notifications — mark notifications read.
 *  Body: { ids?: string[], all?: boolean }
 */
export async function PATCH(request: NextRequest) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  let q = supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  if (parsed.data.ids && parsed.data.ids.length > 0) {
    q = q.in("id", parsed.data.ids);
  } else if (parsed.data.all) {
    q = q.eq("read", false);
  } else {
    return NextResponse.json({ error: "nothing_to_do" }, { status: 400 });
  }

  const { error } = await q;
  if (error) {
    logger.error("notifications.mark_read_failed", { message: error.message });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
