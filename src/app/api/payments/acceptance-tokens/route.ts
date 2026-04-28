import { NextResponse } from "next/server";
import { fetchAcceptanceTokens } from "@/lib/services/wompi";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await fetchAcceptanceTokens();
    return NextResponse.json(tokens);
  } catch (err) {
    logger.error("payments.acceptance_tokens_failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "wompi_unavailable" },
      { status: 502 },
    );
  }
}
