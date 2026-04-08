import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateWebhookSignature, mapWompiStatus, type PlanId } from "@/lib/wompi";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Validate webhook signature
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  const timestamp = request.headers.get("x-event-timestamp") ?? "";
  const checksum = request.headers.get("x-checksum") ?? "";

  if (eventsSecret && timestamp && checksum) {
    const valid = validateWebhookSignature(body, timestamp, checksum, eventsSecret);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Only handle transaction events
  const event = body.event as string;
  if (!event?.startsWith("transaction.")) {
    return NextResponse.json({ received: true });
  }

  const transaction = body?.data?.transaction;
  if (!transaction) {
    return NextResponse.json({ received: true });
  }

  const {
    id: wompiTransactionId,
    reference,
    status: wompiStatus,
    amount_in_cents: amountCents,
    currency,
  } = transaction;

  const supabase = await createServiceClient();

  // Find our payment record by reference
  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, plan_id, status")
    .eq("wompi_reference", reference)
    .single();

  if (!payment) {
    // Unknown reference — ignore
    return NextResponse.json({ received: true });
  }

  const internalStatus = mapWompiStatus(wompiStatus);

  // Update payment record
  await supabase
    .from("payments")
    .update({
      wompi_transaction_id: wompiTransactionId,
      status: internalStatus,
      wompi_data: transaction,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  // On approval → activate subscription
  if (internalStatus === "approved") {
    await supabase
      .from("profiles")
      .update({
        subscription_tier: payment.plan_id as PlanId,
        subscription_status: "active",
        subscription_id: wompiTransactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.user_id);
  }

  // On voided/declined after being active → cancel
  if (internalStatus === "voided" || internalStatus === "declined") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_id")
      .eq("id", payment.user_id)
      .single();

    if (profile?.subscription_id === wompiTransactionId) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.user_id);
    }
  }

  return NextResponse.json({ received: true });
}
