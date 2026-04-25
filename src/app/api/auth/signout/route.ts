import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.warn("auth.signout_failed", { message: error.message });
  } else {
    logger.info("auth.signout_success");
  }
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
