import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAdCreative } from "@/lib/services/gemini";
import { uploadBuffer, BUCKETS } from "@/lib/services/storage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listing, photoUrls, adCopy, format, listingId } = body;

  if (!listing || !photoUrls?.length || !adCopy || !listingId) {
    return NextResponse.json(
      { error: "listing, photoUrls, adCopy, and listingId are required" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const creative = await generateAdCreative(listing, photoUrls, adCopy, format);

    const path = `${user.id}/${listingId}/${format ?? "instagram_square"}-${Date.now()}.jpg`;
    const creativeUrl = await uploadBuffer(
      creative,
      BUCKETS.AD_CREATIVES,
      path,
      "image/jpeg"
    );

    return NextResponse.json({ url: creativeUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ad creative generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
