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
  if (!body?.listing_id) return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });

  const {
    listing_id,
    property_type,
    address,
    city,
    state,
    bedrooms,
    bathrooms,
    sqft,
    year_built,
    garage_spaces,
    hoa_monthly,
    price,
    amenities,
    story,
  } = body;

  const ptLabel: Record<string, string> = {
    single_family: "Single Family Home", condo: "Condo",
    townhouse: "Townhouse", multi_family: "Multi-Family",
    apartment: "Apartment", house: "House",
  };

  const specs = [
    ptLabel[property_type] ?? "Home",
    sqft ? `${Number(sqft).toLocaleString()} sqft` : null,
    bedrooms ? `${bedrooms} bed` : null,
    bathrooms ? `${bathrooms} bath` : null,
    year_built ? `built ${year_built}` : null,
    garage_spaces ? `${garage_spaces}-car garage` : null,
    hoa_monthly ? `HOA $${hoa_monthly}/mo` : null,
  ].filter(Boolean).join(", ");

  const priceStr = price ? `$${Number(price).toLocaleString()}` : "price TBD";
  const location = [address, city, state].filter(Boolean).join(", ");
  const amenitiesList = amenities?.length > 0 ? amenities.join(", ") : "not listed";

  const prompt = `You are a top real estate copywriter in the US. Write 3 compelling property listing descriptions for this home.

PROPERTY:
- ${specs}
- Location: ${location}
- Asking price: ${priceStr}
- Amenities: ${amenitiesList}
- Seller's story: "${story || "Not provided"}"

WRITE 3 VERSIONS:
1. EMOTIONAL — paint a picture of the lifestyle. Focus on feeling, community, and the joy of living here. Conversational and warm.
2. PROFESSIONAL — MLS-quality copy. Lead with the strongest features, use precise language, include key specs naturally. Authoritative.
3. SOCIAL — casual, punchy, shareable. Think TikTok caption meets Instagram bio. Short sentences. Energy. Hook in the first line.

REQUIREMENTS for each:
- 120–200 words (social can be 60–100)
- Include a short title (max 8 words)
- Written in American English
- End with a subtle call-to-action
- NO emojis, NO price mentions, NO commission mentions
- Also provide: seoDescription (1 sentence, 150 chars max) and socialCaption (2-3 lines, Instagram-ready)

Respond ONLY with valid JSON:
{
  "descriptions": [
    {
      "type": "emotional",
      "title": "...",
      "body": "...",
      "seoDescription": "...",
      "socialCaption": "..."
    },
    {
      "type": "professional",
      "title": "...",
      "body": "...",
      "seoDescription": "...",
      "socialCaption": "..."
    },
    {
      "type": "social",
      "title": "...",
      "body": "...",
      "seoDescription": "...",
      "socialCaption": "..."
    }
  ]
}`;

  try {
    logger.info("ai.generate-listing.start", { listingId: listing_id, userId: user.id });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error("ai.generate-listing.parse-error", { listingId: listing_id });
      return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const descriptions = parsed.descriptions;

    // Persist to DB
    await supabase
      .from("listings")
      .update({ ai_descriptions: descriptions })
      .eq("id", listing_id)
      .eq("user_id", user.id);

    logger.info("ai.generate-listing.success", { listingId: listing_id, count: descriptions.length });
    return NextResponse.json({ descriptions });
  } catch (err) {
    logger.error("ai.generate-listing.error", { listingId: listing_id, error: String(err) });
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
