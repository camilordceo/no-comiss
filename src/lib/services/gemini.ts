/**
 * Google Gemini API service for image enhancement and ad creative generation.
 * Uses Gemini 2.5 Flash (multimodal).
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-2.0-flash-exp"; // supports image output

function getApiKey(): string {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_GEMINI_API_KEY is not set");
  return key;
}

/**
 * Fetch an image URL and return it as a base64-encoded string with MIME type.
 */
async function imageUrlToBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const data = Buffer.from(buffer).toString("base64");
  return { data, mimeType };
}

/**
 * Enhance a listing photo using Gemini.
 *
 * Sends the photo with a prompt asking for:
 * - Brightening, white balance correction
 * - Perspective straightening suggestions
 * - Virtual staging notes
 *
 * Returns a Buffer of the enhanced image (JPEG).
 */
export async function enhanceListingPhoto(
  imageUrl: string,
  customPrompt?: string
): Promise<Buffer> {
  const apiKey = getApiKey();
  const { data, mimeType } = await imageUrlToBase64(imageUrl);

  const prompt =
    customPrompt ??
    `Enhance this real estate listing photo for maximum appeal:
- Correct white balance and brightness
- Remove lens distortion if present
- Enhance natural colors without over-saturation
- Sharpen details
- Keep the image photorealistic — do not add fake elements
Return only the enhanced image.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      responseMimeType: "image/jpeg",
    },
  };

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const result = await res.json();
  const imageData =
    result.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data;

  if (!imageData) {
    throw new Error("Gemini did not return an image");
  }

  return Buffer.from(imageData, "base64");
}

interface ListingData {
  title: string;
  address: string;
  city: string;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_m2?: number;
}

/**
 * Generate an ad creative image using Gemini.
 *
 * Combines listing photos and ad copy into a polished ad creative.
 * Returns a Buffer of the generated creative (JPEG/PNG).
 */
export async function generateAdCreative(
  listing: ListingData,
  photoUrls: string[],
  adCopy: { headline: string; body: string; cta: string },
  format: "instagram_square" | "instagram_story" | "facebook_feed" = "instagram_square"
): Promise<Buffer> {
  const apiKey = getApiKey();

  // Use first photo as the base image
  const primaryPhoto = photoUrls[0];
  if (!primaryPhoto) throw new Error("At least one photo is required");

  const { data, mimeType } = await imageUrlToBase64(primaryPhoto);

  const dimensions: Record<typeof format, string> = {
    instagram_square: "1080x1080 square",
    instagram_story: "1080x1920 vertical story",
    facebook_feed: "1200x630 horizontal feed",
  };

  const priceFormatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const specs = [
    listing.bedrooms ? `${listing.bedrooms} hab` : null,
    listing.bathrooms ? `${listing.bathrooms} baños` : null,
    listing.area_m2 ? `${listing.area_m2}m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const prompt = `Create a professional real estate advertisement image for social media.

FORMAT: ${dimensions[format]}
STYLE: Modern, clean, luxury real estate aesthetic. Dark overlay on photo, bold typography.

CONTENT TO INCLUDE:
- Headline: "${adCopy.headline}"
- Body text: "${adCopy.body}"
- CTA button: "${adCopy.cta}"
- Price: ${priceFormatted}
- Property specs: ${specs}
- Location: ${listing.city}

DESIGN RULES:
- Use the provided listing photo as the background
- Apply a subtle dark gradient overlay (bottom 40%) for text legibility
- Primary color accent: #40d99d (teal-green) for the CTA button and price
- White text for headline and specs
- Clean sans-serif font style (Inter/Montserrat aesthetic)
- Small "NoComiss" branding in corner
- Professional, not cluttered

Use the provided photo as the background image.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      responseMimeType: "image/jpeg",
    },
  };

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const result = await res.json();
  const imageData =
    result.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data: string } }) => p.inlineData
    )?.inlineData?.data;

  if (!imageData) {
    throw new Error("Gemini did not return a creative image");
  }

  return Buffer.from(imageData, "base64");
}
