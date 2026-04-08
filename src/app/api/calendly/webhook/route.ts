import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyShowingScheduled } from "@/lib/notifications";
import crypto from "crypto";

// Calendly sends: event_type, payload, created_at, created_by
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Validate Calendly webhook signature
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (signingKey) {
    const signature = request.headers.get("calendly-webhook-signature") ?? "";
    const [t, v1] = signature.split(",").map((s: string) => s.split("=")[1]);
    if (t && v1) {
      const rawBody = JSON.stringify(body);
      const expected = crypto
        .createHmac("sha256", signingKey)
        .update(`${t}.${rawBody}`)
        .digest("hex");
      if (expected !== v1) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
  }

  const eventType = body.event as string;
  const payload = body.payload;

  // Only handle invitee.created (new booking)
  if (eventType !== "invitee.created") {
    return NextResponse.json({ received: true });
  }

  const supabase = await createServiceClient();

  const inviteeName: string = payload?.name ?? "Comprador";
  const inviteeEmail: string = payload?.email ?? "";
  const startTime: string = payload?.event?.start_time ?? "";
  const eventUri: string = payload?.event?.uri ?? "";
  const inviteeUri: string = payload?.uri ?? "";

  // Try to match this Calendly booking to a listing via tracking param
  // Calendly allows custom "utm_content" or "custom_questions" in the booking URL
  const trackingUtm = payload?.tracking?.utm_content as string | undefined;
  const questionAnswers: Array<{ question: string; answer: string }> =
    payload?.questions_and_answers ?? [];

  // We embed listing_id in utm_content when building the Calendly link
  let listingId: string | undefined = trackingUtm;

  // Also check custom question answers
  if (!listingId) {
    const listingAnswer = questionAnswers.find(
      (q) => q.question.toLowerCase().includes("inmueble") ||
             q.question.toLowerCase().includes("listing")
    );
    if (listingAnswer) listingId = listingAnswer.answer;
  }

  if (!listingId) {
    console.warn("[calendly/webhook] No listing_id found in booking — storing without link");
  }

  // Get listing + seller
  let sellerId: string | undefined;
  let listingTitle = "inmueble";
  let sellerEmail: string | undefined;
  let sellerPhone: string | undefined;

  if (listingId) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id, title, user_id")
      .eq("id", listingId)
      .single();

    if (listing) {
      sellerId = listing.user_id;
      listingTitle = listing.title;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, phone")
        .eq("id", listing.user_id)
        .single();

      sellerEmail = profile?.email;
      sellerPhone = profile?.phone ?? undefined;
    }
  }

  // Create showing record
  if (sellerId && listingId) {
    await supabase.from("showings").insert({
      listing_id: listingId,
      seller_id: sellerId,
      buyer_name: inviteeName,
      buyer_email: inviteeEmail || null,
      scheduled_at: startTime,
      status: "confirmed",
      calendly_event_uri: eventUri,
      calendly_invitee_uri: inviteeUri,
    });
  }

  // Notify seller
  if (sellerEmail || sellerPhone) {
    const dateStr = startTime
      ? new Date(startTime).toLocaleDateString("es-CO", {
          weekday: "long", day: "numeric", month: "long",
          hour: "2-digit", minute: "2-digit",
        })
      : "fecha pendiente";

    notifyShowingScheduled({
      sellerEmail,
      sellerPhone,
      buyerEmail: inviteeEmail || undefined,
      listingTitle,
      buyerName: inviteeName,
      scheduledAt: dateStr,
    }).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
