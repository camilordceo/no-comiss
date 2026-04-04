import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { fullName, email, phone, addressOrZip, homeValue, timeline } = body;

  if (!email || !fullName || !addressOrZip) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("interested_sellers").insert({
    full_name: fullName,
    email,
    phone: phone || null,
    address_or_zip: addressOrZip,
    home_value_range: homeValue,
    timeline,
    source: "landing_page",
  });

  if (error) {
    console.error("interested_sellers insert error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
