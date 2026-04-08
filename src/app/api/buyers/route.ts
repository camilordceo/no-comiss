import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const {
    name, email, phone, whatsapp,
    budget_min, budget_max,
    preferred_cities, preferred_types,
    min_bedrooms, min_area_m2,
    buying_timeline, financing_type, pre_approved,
    notes, source,
  } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }

  const supabase = await createClient();
  const adminSupabase = await createServiceClient();

  // Link to user account if authenticated
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await adminSupabase
    .from("buyer_profiles")
    .insert({
      user_id: user?.id ?? null,
      name,
      email,
      phone: phone ?? null,
      whatsapp: whatsapp ?? null,
      budget_min: budget_min ?? null,
      budget_max: budget_max ?? null,
      preferred_cities: preferred_cities ?? [],
      preferred_types: preferred_types ?? [],
      min_bedrooms: min_bedrooms ?? null,
      min_area_m2: min_area_m2 ?? null,
      buying_timeline: buying_timeline ?? null,
      financing_type: financing_type ?? null,
      pre_approved: pre_approved ?? false,
      notes: notes ?? null,
      source: source ?? "web",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ buyer: data });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error: qErr } = await supabase
    .from("buyer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (qErr) return NextResponse.json({ buyer: null });
  return NextResponse.json({ buyer: data });
}
