import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { verifyWompiWebhook, type WompiTransactionResponse } from "@/lib/services/wompi";

export const dynamic = "force-dynamic";

const PLAN_DAYS_UPFRONT = 90;
const PLAN_DAYS_MONTHLY = 30;

interface WompiWebhookEvent {
  event: string;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
  data: {
    transaction?: WompiTransactionResponse & { reference?: string };
    payment_source?: {
      id: number;
      status: "AVAILABLE" | "PENDING" | "DECLINED" | "ERROR";
    };
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  let event: WompiWebhookEvent;
  try {
    event = JSON.parse(body) as WompiWebhookEvent;
  } catch {
    return new NextResponse("invalid_json", { status: 400 });
  }

  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    logger.error("webhooks.wompi.missing_events_secret");
    return new NextResponse("misconfigured", { status: 500 });
  }
  if (!verifyWompiWebhook(event, eventsSecret)) {
    logger.warn("webhooks.wompi.bad_signature", { eventName: event.event });
    return new NextResponse("unauthorized", { status: 401 });
  }

  const supabase = await createServiceClient();

  if (event.event === "transaction.updated" && event.data.transaction) {
    const tx = event.data.transaction;
    const reference = tx.reference;
    if (!reference) {
      return new NextResponse("ok", { status: 200 });
    }

    const { data: row, error: rowErr } = await supabase
      .from("wompi_transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (rowErr) {
      logger.error("webhooks.wompi.lookup_failed", { reference, message: rowErr.message });
    }
    if (!row) {
      logger.warn("webhooks.wompi.unknown_reference", { reference });
      return new NextResponse("ok", { status: 200 });
    }

    await supabase
      .from("wompi_transactions")
      .update({
        status: tx.status,
        wompi_transaction_id: tx.id,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    if (tx.status === "APPROVED" && row.status !== "APPROVED" && row.plan) {
      const isUpfront =
        typeof row.metadata === "object" &&
        row.metadata != null &&
        !Array.isArray(row.metadata) &&
        (row.metadata as Record<string, unknown>).mode === "upfront";
      const startedAt = new Date();
      const nextBilling = new Date(startedAt);
      nextBilling.setDate(
        nextBilling.getDate() + (isUpfront ? PLAN_DAYS_UPFRONT : PLAN_DAYS_MONTHLY),
      );

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          plan: row.plan,
          subscription_status: "active",
          subscription_plan: row.plan,
          subscription_started_at: startedAt.toISOString(),
          subscription_next_billing_at: nextBilling.toISOString(),
        })
        .eq("id", row.user_id);
      if (profileErr) {
        logger.error("webhooks.wompi.profile_update_failed", {
          userId: row.user_id,
          message: profileErr.message,
        });
      }

      await supabase.from("notifications").insert({
        user_id: row.user_id,
        type: "system",
        title: "Payment approved",
        body: `Your ${row.plan} plan is now active.`,
        action_url: "/dashboard/settings",
      });

      logger.info("webhooks.wompi.subscription_activated", {
        userId: row.user_id,
        plan: row.plan,
        reference,
      });
    }

    if (tx.status === "DECLINED" && row.payment_source_id) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("id", row.user_id);

      await supabase.from("notifications").insert({
        user_id: row.user_id,
        type: "system",
        title: "Payment failed",
        body: "Your last payment was declined. Update your card to keep access.",
        action_url: "/dashboard/settings",
      });
    }
  }

  if (event.event === "payment_source.created" && event.data.payment_source) {
    const ps = event.data.payment_source;
    await supabase
      .from("payment_sources")
      .update({ status: ps.status })
      .eq("wompi_payment_source_id", ps.id);
  }

  return new NextResponse("ok", { status: 200 });
}
