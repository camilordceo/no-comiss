import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "cancelled",
      subscription_cancelled_at: now,
    })
    .eq("id", user.id);

  if (error) {
    logger.error("subscription.cancel_failed", {
      userId: user.id,
      message: error.message,
    });
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "system",
    title: "Subscription cancelled",
    body: "Your plan stays active until the end of the current billing period.",
    action_url: "/dashboard/settings",
  });

  logger.info("subscription.cancelled", { userId: user.id });
  return NextResponse.json({ ok: true });
}
