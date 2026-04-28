import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import {
  amountInCents,
  createRecurringCharge,
  fetchAcceptanceTokens,
  generateReference,
  generateSignature,
  getPlan,
} from "@/lib/services/wompi";

export const dynamic = "force-dynamic";

const PLAN_DAYS_MONTHLY = 30;

const bodySchema = z.object({
  userId: z.string().uuid(),
  paymentSourceId: z.string().uuid().optional(),
});

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === expected;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!integritySecret) {
    return NextResponse.json({ error: "wompi_not_configured" }, { status: 500 });
  }

  const supabase = await createServiceClient();

  // Load profile + email
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, subscription_plan, subscription_status, plan")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (profileErr || !profile) {
    logger.warn("payments.recurring_profile_missing", {
      userId: parsed.data.userId,
      message: profileErr?.message,
    });
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const planId = (profile.subscription_plan ?? profile.plan) as
    | "starter"
    | "pro"
    | "elite"
    | null;
  if (!planId) {
    return NextResponse.json({ error: "no_active_plan" }, { status: 409 });
  }
  const plan = getPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 409 });
  }

  // Find the payment source: either explicit or default
  const psQuery = supabase
    .from("payment_sources")
    .select("*")
    .eq("user_id", profile.id)
    .eq("status", "AVAILABLE");
  const { data: psRows } = parsed.data.paymentSourceId
    ? await psQuery.eq("id", parsed.data.paymentSourceId).limit(1)
    : await psQuery.order("is_default", { ascending: false }).limit(1);

  const ps = psRows?.[0];
  if (!ps || !ps.wompi_payment_source_id) {
    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due" })
      .eq("id", profile.id);
    return NextResponse.json({ error: "no_payment_source" }, { status: 409 });
  }

  // Fresh acceptance token (Wompi expires them quickly)
  let acceptanceToken: string;
  try {
    const tokens = await fetchAcceptanceTokens();
    acceptanceToken = tokens.acceptance_token;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("payments.recurring_acceptance_token_failed", { message });
    return NextResponse.json({ error: "wompi_unavailable" }, { status: 502 });
  }

  const amount = amountInCents(plan, "monthly");
  const reference = generateReference(plan.id, profile.id);
  const signature = generateSignature(reference, amount, "COP", integritySecret);

  const { error: preInsertErr } = await supabase.from("wompi_transactions").insert({
    user_id: profile.id,
    reference,
    amount_in_cents: amount,
    currency: "COP",
    status: "PENDING",
    payment_method_type: "CARD",
    payment_source_id: ps.id,
    plan: plan.id,
    metadata: { mode: "monthly", source: "cron" },
  });
  if (preInsertErr) {
    logger.error("payments.recurring_cron_preinsert_failed", {
      userId: profile.id,
      message: preInsertErr.message,
    });
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  let tx;
  try {
    tx = await createRecurringCharge({
      amountCents: amount,
      reference,
      customerEmail: profile.email,
      paymentSourceId: ps.wompi_payment_source_id,
      acceptanceToken,
      signature,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("payments.recurring_cron_charge_failed", {
      userId: profile.id,
      reference,
      message,
    });
    await supabase
      .from("wompi_transactions")
      .update({
        status: "ERROR",
        metadata: { mode: "monthly", source: "cron", error: message },
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);
    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due" })
      .eq("id", profile.id);
    return NextResponse.json({ error: "wompi_failed", message }, { status: 502 });
  }

  await supabase
    .from("wompi_transactions")
    .update({
      wompi_transaction_id: tx.id,
      status: tx.status,
      updated_at: new Date().toISOString(),
    })
    .eq("reference", reference);

  if (tx.status === "APPROVED") {
    const next = new Date();
    next.setDate(next.getDate() + PLAN_DAYS_MONTHLY);
    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_next_billing_at: next.toISOString(),
      })
      .eq("id", profile.id);
  } else if (tx.status === "DECLINED" || tx.status === "ERROR") {
    await supabase
      .from("profiles")
      .update({ subscription_status: "past_due" })
      .eq("id", profile.id);
    await supabase.from("notifications").insert({
      user_id: profile.id,
      type: "system",
      title: "Payment failed",
      body: "Your monthly charge was declined. Update your card to keep access.",
      action_url: "/dashboard/settings",
    });
  }

  logger.info("payments.recurring_charged", {
    userId: profile.id,
    reference,
    wompiId: tx.id,
    status: tx.status,
  });

  return NextResponse.json({
    transactionId: tx.id,
    reference,
    status: tx.status,
  });
}
