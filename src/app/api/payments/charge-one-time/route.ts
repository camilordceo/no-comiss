import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import {
  amountInCents,
  createCardTransaction,
  generateReference,
  generateSignature,
  getPlan,
} from "@/lib/services/wompi";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  plan: z.enum(["starter", "pro", "elite"]),
  cardToken: z.string().min(1),
  acceptanceToken: z.string().min(1),
  acceptPersonalAuth: z.string().min(1),
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

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!integritySecret) {
    logger.error("payments.charge_missing_integrity_secret", { userId: user.id });
    return NextResponse.json({ error: "wompi_not_configured" }, { status: 500 });
  }

  const plan = getPlan(parsed.data.plan);
  if (!plan) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const amount = amountInCents(plan, "upfront");
  const reference = generateReference(plan.id, user.id);
  const signature = generateSignature(reference, amount, "COP", integritySecret);
  const customerEmail = user.email ?? "";
  if (!customerEmail) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  // Pre-insert PENDING row so we can correlate by reference even before Wompi
  // returns or webhooks fire.
  const { error: preInsertErr } = await supabase.from("wompi_transactions").insert({
    user_id: user.id,
    reference,
    amount_in_cents: amount,
    currency: "COP",
    status: "PENDING",
    payment_method_type: "CARD",
    plan: plan.id,
    metadata: {
      mode: "upfront",
      card_last_four: parsed.data.cardLastFour ?? null,
      card_brand: parsed.data.cardBrand ?? null,
    },
  });
  if (preInsertErr) {
    logger.error("payments.charge_preinsert_failed", {
      userId: user.id,
      message: preInsertErr.message,
    });
    return NextResponse.json({ error: "db_insert_failed" }, { status: 500 });
  }

  let tx;
  try {
    tx = await createCardTransaction({
      amountCents: amount,
      reference,
      customerEmail,
      cardToken: parsed.data.cardToken,
      acceptanceToken: parsed.data.acceptanceToken,
      acceptPersonalAuth: parsed.data.acceptPersonalAuth,
      signature,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("payments.wompi_create_failed", {
      userId: user.id,
      reference,
      message,
    });
    await supabase
      .from("wompi_transactions")
      .update({
        status: "ERROR",
        metadata: { mode: "upfront", error: message },
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

  logger.info("payments.charge_initiated", {
    userId: user.id,
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
