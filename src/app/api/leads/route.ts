import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notifyNewLead } from "@/lib/notifications";

export async function POST(request: Request) {
  const supabase = await createClient();
  const adminSupabase = await createServiceClient();
  const body = await request.json();

  const { listing_id, user_id, name, phone, email, message, source } = body;

  if (!listing_id || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      listing_id,
      user_id,
      name,
      phone: phone || null,
      email: email || null,
      message: message || null,
      source: source || "web",
      status: "new",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment leads_count
  await supabase.rpc("increment_leads_count", { listing_id });

  // Fire notification to seller (non-blocking)
  try {
    const { data: listing } = await adminSupabase
      .from("listings")
      .select("title, user_id")
      .eq("id", listing_id)
      .single();

    if (listing) {
      const { data: sellerProfile } = await adminSupabase
        .from("profiles")
        .select("email, phone")
        .eq("id", listing.user_id)
        .single();

      if (sellerProfile) {
        notifyNewLead({
          sellerEmail: sellerProfile.email,
          sellerPhone: sellerProfile.phone ?? undefined,
          listingTitle: listing.title,
          buyerName: name,
          buyerPhone: phone,
          buyerEmail: email,
          message,
        }).catch(console.error);
      }
    }
  } catch {
    // notification failure is non-fatal
  }

  return NextResponse.json(data);
}
