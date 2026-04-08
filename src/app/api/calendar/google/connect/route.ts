import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    );
  }

  // State = userId so we know who authorized in the callback
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64url");

  try {
    const url = buildGoogleAuthUrl(state);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=google_not_configured`
    );
  }
}
