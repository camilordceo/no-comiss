import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    logger.warn("auth.callback_missing_code");
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.error("auth.callback_exchange_failed", { message: error.message });
    return NextResponse.redirect(`${origin}/login?error=callback_failed`);
  }

  logger.info("auth.callback_success");
  return NextResponse.redirect(`${origin}${next}`);
}
