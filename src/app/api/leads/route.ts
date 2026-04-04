import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
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

  return NextResponse.json(data);
}
