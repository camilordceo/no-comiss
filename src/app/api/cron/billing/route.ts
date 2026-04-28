import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

interface DueRow {
  id: string;
  email: string;
  subscription_plan: string | null;
  subscription_next_billing_at: string | null;
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically.
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === expected;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const nowIso = new Date().toISOString();

  // Subscriptions due today (or earlier — handles missed runs)
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, subscription_plan, subscription_next_billing_at")
    .eq("subscription_status", "active")
    .not("subscription_plan", "is", null)
    .lte("subscription_next_billing_at", nowIso)
    .limit(500);

  if (error) {
    logger.error("cron.billing.query_failed", { message: error.message });
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const due = (data ?? []) as DueRow[];
  if (due.length === 0) {
    return NextResponse.json({ ok: true, charged: 0, due: 0 });
  }

  const cronSecret = process.env.CRON_SECRET!;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  let approved = 0;
  let declined = 0;
  let errored = 0;

  for (const row of due) {
    try {
      const res = await fetch(`${baseUrl}/api/payments/charge-recurring`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: row.id }),
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (j.status === "APPROVED") approved++;
      else if (j.status === "DECLINED") declined++;
      else errored++;
    } catch (err) {
      errored++;
      logger.error("cron.billing.charge_threw", {
        userId: row.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info("cron.billing.run", {
    due: due.length,
    approved,
    declined,
    errored,
  });

  return NextResponse.json({
    ok: true,
    due: due.length,
    approved,
    declined,
    errored,
  });
}
