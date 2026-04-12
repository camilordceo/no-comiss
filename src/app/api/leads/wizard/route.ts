import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { logger } from "@/lib/utils/logger";

function getServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const { email, address, sessionId, estimatedValue } = body;

    const supabase = getServiceClient();

    // Store wizard lead in interested_sellers
    const { error } = await supabase.from("interested_sellers").upsert(
      {
        email: email.toLowerCase().trim(),
        full_name: "",
        address_or_zip: address ?? "",
        home_value_range: estimatedValue ? `~$${Math.round(estimatedValue / 1000)}k` : null,
        source: "wizard_preview",
      },
      { onConflict: "email", ignoreDuplicates: true }
    );

    if (error) {
      logger.error("leads.wizard.db-error", { email: email.toLowerCase().trim(), error: error.message });
    } else {
      logger.info("leads.wizard.captured", { email: email.toLowerCase().trim(), address });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("leads.wizard.error", { error: String(err) });
    return NextResponse.json({ ok: true });
  }
}
