import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  PLANS,
  generateReference,
  generateIntegrityHash,
  buildCheckoutUrl,
  type PlanId,
} from "@/lib/wompi";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const planId = body.planId as PlanId;

  if (!planId || !PLANS[planId]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = PLANS[planId];

  // Config
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!publicKey || !integritySecret) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 503 }
    );
  }

  // Fetch user profile for prefill
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  // Generate reference
  const reference = generateReference(user.id, planId);
  const currency = "COP";

  // Integrity hash
  const integrityHash = generateIntegrityHash(
    reference,
    plan.amountCents,
    currency,
    integritySecret
  );

  // Save pending payment record
  const adminSupabase = await createServiceClient();
  await adminSupabase.from("payments").insert({
    user_id: user.id,
    wompi_reference: reference,
    amount_cents: plan.amountCents,
    currency,
    status: "pending",
    plan_id: planId,
    plan_name: plan.name,
  });

  // Build Wompi checkout URL
  const checkoutUrl = buildCheckoutUrl({
    publicKey,
    reference,
    amountCents: plan.amountCents,
    currency,
    integrityHash,
    redirectUrl: `${appUrl}/dashboard/settings?payment=success&plan=${planId}`,
    customerEmail: profile?.email ?? user.email ?? undefined,
    customerFullName: profile?.full_name ?? undefined,
  });

  return NextResponse.json({ checkoutUrl, reference });
}
