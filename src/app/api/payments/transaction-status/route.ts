import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { getTransaction } from "@/lib/services/wompi";

export const dynamic = "force-dynamic";

const PLAN_DAYS_UPFRONT = 90;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Find our local row first (RLS scopes by user — guarantees they own it).
  const { data: local, error: localErr } = await supabase
    .from("wompi_transactions")
    .select("*")
    .eq("wompi_transaction_id", id)
    .maybeSingle();

  if (localErr) {
    logger.warn("payments.status_local_lookup_failed", { id, message: localErr.message });
  }
  if (!local) {
    return NextResponse.json({ error: "transaction_not_found" }, { status: 404 });
  }

  let tx;
  try {
    tx = await getTransaction(id);
  } catch (err) {
    logger.error("payments.status_wompi_failed", {
      id,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ status: local.status, stale: true });
  }

  // Always reflect the latest status in our DB, even if it's still PENDING.
  if (tx.status !== local.status) {
    await supabase
      .from("wompi_transactions")
      .update({ status: tx.status, updated_at: new Date().toISOString() })
      .eq("wompi_transaction_id", id);
  }

  // Activate the plan on first APPROVED transition.
  const isUpfront =
    typeof local.metadata === "object" &&
    local.metadata != null &&
    !Array.isArray(local.metadata) &&
    (local.metadata as Record<string, unknown>).mode === "upfront";

  if (
    tx.status === "APPROVED" &&
    local.status !== "APPROVED" &&
    local.plan
  ) {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + (isUpfront ? PLAN_DAYS_UPFRONT : 30));

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        plan: local.plan,
        subscription_status: "active",
        subscription_plan: local.plan,
        subscription_started_at: startedAt.toISOString(),
        subscription_next_billing_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);
    if (profileErr) {
      logger.error("payments.profile_activation_failed", {
        userId: user.id,
        message: profileErr.message,
      });
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "system",
      title: "Payment approved",
      body: `Your ${local.plan.charAt(0).toUpperCase() + local.plan.slice(1)} plan is now active.`,
      action_url: "/dashboard/settings",
    });

    logger.info("payments.subscription_activated", {
      userId: user.id,
      plan: local.plan,
      reference: local.reference,
    });
  }

  return NextResponse.json({
    status: tx.status,
    reference: tx.reference,
    transactionId: tx.id,
    statusMessage: tx.status_message ?? null,
  });
}
