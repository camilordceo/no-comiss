import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.listing_id || !body?.platform) {
    return NextResponse.json({ error: "listing_id and platform required" }, { status: 400 });
  }

  const { listing_id, platform } = body;

  // Verify ownership and get listing data
  const { data: listing } = await supabase
    .from("listings")
    .select("title, description, address, city, state, price, bedrooms, bathrooms, sqft, area_m2, photos, amenities")
    .eq("id", listing_id)
    .eq("user_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.price);
  const sqft = listing.sqft ?? listing.area_m2;
  const location = [listing.city, listing.state].filter(Boolean).join(", ");

  const platformInstructions: Record<string, string> = {
    instagram: "Instagram: 2-3 punchy lines + 10-15 hashtags. Use line breaks. Emoji welcome. Max 300 words.",
    facebook: "Facebook: Conversational 3-5 sentences. No hashtags. Friendly tone. Max 200 words.",
    tiktok: "TikTok: Script for a 30-60 second video. Include hook, 3 key points, and a CTA. Conversational. Max 150 words.",
    twitter: "Twitter/X: 1-2 punchy sentences under 280 characters. No hashtags unless highly relevant.",
  };

  const instructions = platformInstructions[platform] ?? platformInstructions.instagram;

  const prompt = `Write a social media post for this home listing.

PLATFORM: ${platform.toUpperCase()}
INSTRUCTIONS: ${instructions}

PROPERTY:
- Title: ${listing.title}
- Location: ${location || listing.address}
- Price: ${price}
- Details: ${[
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    sqft ? `${Number(sqft).toLocaleString()} sqft` : null,
  ].filter(Boolean).join(", ")}
- Description: ${listing.description?.slice(0, 300) ?? "Beautiful home for sale"}
- Amenities: ${listing.amenities?.slice(0, 5).join(", ") || "none listed"}

RULES:
- Highlight the home's best features
- Create urgency without being pushy
- End with a clear call to action (schedule a showing, DM for details, link in bio)
- Do NOT mention commissions or agents
- Write in first person as the homeowner

Return ONLY the post text, ready to copy-paste. No extra commentary.`;

  try {
    logger.info("ai.social-post.start", { listingId: listing_id, platform, userId: user.id });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    logger.info("ai.social-post.success", { listingId: listing_id, platform });
    return NextResponse.json({ post: text, platform });
  } catch (err) {
    logger.error("ai.social-post.error", { listingId: listing_id, error: String(err) });
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
