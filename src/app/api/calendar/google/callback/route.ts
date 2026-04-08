import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=google_denied`);
  }

  // Decode state to get userId
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const supabase = await createServiceClient();

    await supabase.from("calendar_connections").upsert(
      {
        user_id: userId,
        provider: "google",
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
        google_token_expiry: expiryDate,
        google_email: tokens.email ?? null,
        google_calendar_id: "primary",
        connected: true,
        scopes: ["calendar.events", "userinfo.email"],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.redirect(`${appUrl}/dashboard/settings?calendar=connected`);
  } catch (err) {
    console.error("[calendar/google/callback]", err);
    return NextResponse.redirect(`${appUrl}/dashboard/settings?error=google_token_failed`);
  }
}
