import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import {
  amountInCents,
  createPaymentSource,
  createRecurringCharge,
  generateReference,
  generateSignature,
  getPlan,
} from "@/lib/services/wompi";

export const dynamic = "force-dynamic";

const PLAN_DAYS_MONTHLY = 30;

const bodySchema = z.object({
  plan: z.enum(["starter", "pro", "elite"]),
  cardToken: z.string().min(1),
  acceptanceToken: z.string().min(1),
  acceptPersonalAuth: z.string().min(1),
  sessionId: z.string().nullish(),
  cardLastFour: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const customerEmail = user.email ?? "";
  if (!customerEmail) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!integritySecret) {
    logger.error("payments.recurring_missing_integrity_secret", { userId: user.id });
    return NextResponse.json({ error: "wompi_not_configured" }, { status: 500 });
  }
  const plan = getPlan(parsed.data.plan);
  if (!plan) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  // 1. Create the Wompi payment source
  let ps;
  try {
    ps = await createPaymentSource({
      cardToken: parsed.data.cardToken,
      customerEmail,
      acceptanceToken: parsed.data.acceptanceToken,
      acceptPersonalAuth: parsed.data.acceptPersonalAuth,
      sessionId: parsed.data.sessionId ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("payments.payment_source_failed", { userId: user.id, message });
    return NextResponse.json({ error: "wompi_failed", message }, { status: 502 });
  }

  // 2. Persist the payment source. This becomes the user's default.
  await supabase
    .from("payment_sources")
    .update({ is_default: false })
    .eq("user_id", user.id);

  const { data: psRow, error: psErr } = await supabase
    .from("payment_sources")
    .insert({
      user_id: user.id,
      wompi_payment_source_id: ps.id,
      card_last_four: parsed.data.cardLastFour ?? ps.public_data?.last_four ?? null,
      card_brand: parsed.data.cardBrand ?? ps.public_data?.brand ?? null,
      is_default: true,
      is_three_ds: false,
      status: ps.status,
    })
    .select("*")
    .single();

  if (psErr || !psRow) {
    logger.error("payments.payment_source_db_insert_failed", {
      userId: user.id,
      message: psErr?.message,
    });
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  // 3. If the source isn't immediately AVAILABLE, stop here. Webhook will
  //    finish the activation when the source transitions to AVAILABLE.
  if (ps.status !== "AVAILABLE") {
    logger.info("payments.payment_source_pending", {
      userId: user.id,
      wompiPsId: ps.id,
      status: ps.status,
    });
    return NextResponse.json({
      paymentSourceId: ps.id,
      status: ps.status,
    });
  }

  // 4. Charge the first month immediately.
  const amount = amountInCents(plan, "monthly");
  const reference = generateReference(plan.id, user.id);
  const signature = generateSignature(reference, amount, "COP", integritySecret);

  const { error: preInsertErr } = await supabase.from("wompi_transactions").insert({
    user_id: user.id,
    reference,
    amount_in_cents: amount,
    currency: "COP",
    status: "PENDING",
    payment_method_type: "CARD",
    payment_source_id: psRow.id,
    plan: plan.id,
    metadata: {
      mode: "monthly",
      card_last_four: parsed.data.cardLastFour ?? null,
      card_brand: parsed.data.cardBrand ?? null,
    },
  });
  if (preInsertErr) {
    logger.error("payments.recurring_preinsert_failed", {
      userId: user.id,
      message: preInsertErr.message,
    });
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  let tx;
  try {
    tx = await createRecurringCharge({
      amountCents: amount,
      reference,
      customerEmail,
      paymentSourceId: ps.id,
      acceptanceToken: parsed.data.acceptanceToken,
      signature,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("payments.first_recurring_charge_failed", {
      userId: user.id,
      reference,
      message,
    });
    await supabase
      .from("wompi_transactions")
      .update({
        status: "ERROR",
        metadata: { mode: "monthly", error: message },
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);
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

  // 5. Activate subscription optimistically. Webhook will reconcile if Wompi
  //    later flips the transaction to DECLINED/ERROR.
  if (tx.status === "APPROVED" || tx.status === "PENDING") {
    const startedAt = new Date();
    const nextBilling = new Date(startedAt);
    nextBilling.setDate(nextBilling.getDate() + PLAN_DAYS_MONTHLY);
    await supabase
      .from("profiles")
      .update({
        plan: plan.id,
        subscription_status: tx.status === "APPROVED" ? "active" : "trial",
        subscription_plan: plan.id,
        subscription_started_at: startedAt.toISOString(),
        subscription_next_billing_at: nextBilling.toISOString(),
        subscription_cancelled_at: null,
      })
      .eq("id", user.id);

    if (tx.status === "APPROVED") {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "system",
        title: "Subscription active",
        body: `Your ${plan.name} plan is now billing monthly.`,
        action_url: "/dashboard/settings",
      });
    }
  }

  logger.info("payments.recurring_initiated", {
    userId: user.id,
    plan: plan.id,
    reference,
    wompiId: tx.id,
    status: tx.status,
  });

  return NextResponse.json({
    paymentSourceId: ps.id,
    transactionId: tx.id,
    reference,
    status: tx.status,
  });
}
