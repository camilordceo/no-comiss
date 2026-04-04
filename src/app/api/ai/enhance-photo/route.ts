import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enhanceListingPhoto } from "@/lib/services/gemini";
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
  const { imageUrl, listingId, prompt } = body;

  if (!imageUrl || !listingId) {
    return NextResponse.json({ error: "imageUrl and listingId are required" }, { status: 400 });
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const enhanced = await enhanceListingPhoto(imageUrl, prompt);

    const path = `${user.id}/${listingId}/enhanced-${Date.now()}.jpg`;
    const enhancedUrl = await uploadBuffer(
      enhanced,
      BUCKETS.LISTING_PHOTOS,
      path,
      "image/jpeg"
    );

    return NextResponse.json({ url: enhancedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enhancement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
