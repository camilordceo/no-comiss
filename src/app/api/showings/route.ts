import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createCalendarEvent,
  getValidAccessToken,
} from "@/lib/google-calendar";
import { notifyShowingScheduled } from "@/lib/notifications";

// POST /api/showings — book a showing
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const {
    listing_id,
    buyer_name,
    buyer_email,
    buyer_phone,
    scheduled_at,   // ISO string
    duration_minutes = 30,
    notes,
  } = body;

  if (!listing_id || !buyer_name || !scheduled_at) {
    return NextResponse.json(
      { error: "listing_id, buyer_name and scheduled_at are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const adminSupabase = await createServiceClient();

  // Get listing + seller info
  const { data: listing } = await adminSupabase
    .from("listings")
    .select("id, title, address, user_id")
    .eq("id", listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Create showing record
  const { data: showing, error: showingError } = await adminSupabase
    .from("showings")
    .insert({
      listing_id,
      seller_id: listing.user_id,
      buyer_name,
      buyer_email: buyer_email ?? null,
      buyer_phone: buyer_phone ?? null,
      scheduled_at,
      duration_minutes,
      seller_notes: notes ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (showingError || !showing) {
    return NextResponse.json({ error: "Failed to create showing" }, { status: 500 });
  }

  // Get seller profile for notifications + calendar
  const { data: sellerProfile } = await adminSupabase
    .from("profiles")
    .select("email, phone")
    .eq("id", listing.user_id)
    .single();

  // Attempt Google Calendar event creation (non-blocking)
  let meetLink: string | undefined;
  try {
    const { data: calendarConn } = await adminSupabase
      .from("calendar_connections")
      .select("google_access_token, google_refresh_token, google_token_expiry, google_calendar_id, google_email")
      .eq("user_id", listing.user_id)
      .eq("provider", "google")
      .eq("connected", true)
      .single();

    if (calendarConn?.google_refresh_token) {
      const accessToken = await getValidAccessToken(calendarConn);

      const scheduledDate = new Date(scheduled_at);
      const dateStr = scheduledDate.toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      const result = await createCalendarEvent({
        accessToken,
        calendarId: calendarConn.google_calendar_id ?? "primary",
        title: `Visita: ${listing.title}`,
        description: `Visita agendada vía NoComiss\n\nComprador: ${buyer_name}\n${buyer_phone ? `Tel: ${buyer_phone}` : ""}\n${buyer_email ? `Email: ${buyer_email}` : ""}\n${notes ? `\nNotas: ${notes}` : ""}`,
        startISO: scheduled_at,
        durationMinutes: duration_minutes,
        attendeeEmails: [
          ...(calendarConn.google_email ? [calendarConn.google_email] : []),
          ...(buyer_email ? [buyer_email] : []),
        ],
        location: listing.address,
        addMeet: true,
      });

      meetLink = result.meetLink;

      // Update showing with Google event id
      await adminSupabase
        .from("showings")
        .update({
          google_event_id: result.eventId,
          google_meet_link: result.meetLink ?? null,
          status: "confirmed",
        })
        .eq("id", showing.id);
    }
  } catch (calErr) {
    console.warn("[showings] Google Calendar error (non-fatal):", calErr);
  }

  // Send notifications (non-blocking)
  const scheduledDate = new Date(scheduled_at);
  const dateStr = scheduledDate.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });

  notifyShowingScheduled({
    sellerEmail: sellerProfile?.email,
    sellerPhone: sellerProfile?.phone ?? undefined,
    buyerEmail: buyer_email,
    buyerPhone: buyer_phone,
    listingTitle: listing.title,
    buyerName: buyer_name,
    scheduledAt: dateStr,
    meetLink,
  }).catch(console.error);

  return NextResponse.json({
    showing: { ...showing, google_meet_link: meetLink ?? null },
  });
}

// GET /api/showings — seller sees their showings
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const listing_id = searchParams.get("listing_id");

  let query = supabase
    .from("showings")
    .select(`
      id, listing_id, buyer_name, buyer_email, buyer_phone,
      scheduled_at, duration_minutes, status,
      google_meet_link, calendly_event_uri,
      seller_notes, feedback, created_at,
      listings(title, address)
    `)
    .eq("seller_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (status) query = query.eq("status", status);
  if (listing_id) query = query.eq("listing_id", listing_id);

  const { data, error: qErr } = await query;

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ showings: data ?? [] });
}
