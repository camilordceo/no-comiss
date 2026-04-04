import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { email, city, home_value, traditional_commission, savings_estimate } = body;

  if (!email || !home_value) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase.from("calculator_leads").insert({
    email,
    home_value,
    city: city || "No especificada",
    traditional_commission: traditional_commission || 0,
    savings_estimate: savings_estimate || 0,
  });

  if (error) {
    // Don't fail the request — just log
    console.error("calculator lead save error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
