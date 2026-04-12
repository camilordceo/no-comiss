import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const alt = "Property listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("title, price, bedrooms, bathrooms, sqft, city, state, photos, area_m2")
    .eq("slug", slug)
    .single();

  const photo = listing?.photos?.[0];
  const price = listing?.price
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(listing.price)
    : "";
  const sqft = (listing?.sqft ?? listing?.area_m2)
    ? `${(listing.sqft ?? listing.area_m2)!.toLocaleString()} sqft`
    : "";
  const location = [listing?.city, listing?.state].filter(Boolean).join(", ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        fontFamily: "sans-serif",
        backgroundColor: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background photo */}
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
        />
      )}

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px", width: "100%" }}>
        {/* NoComiss badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#40d99d" }} />
          <span style={{ color: "#40d99d", fontSize: "18px", fontWeight: 700, letterSpacing: "0.08em" }}>NOCOMISS</span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {price && (
            <div style={{ color: "#40d99d", fontSize: "52px", fontWeight: 800, lineHeight: 1 }}>
              {price}
            </div>
          )}
          <div style={{ color: "white", fontSize: "34px", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px" }}>
            {listing?.title ?? "Beautiful Home for Sale"}
          </div>
          {location && (
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "22px" }}>
              📍 {location}
            </div>
          )}
          {/* Specs */}
          <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
            {listing?.bedrooms && (
              <div style={{ color: "white", fontSize: "20px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px" }}>
                🛏 {listing.bedrooms} bed
              </div>
            )}
            {listing?.bathrooms && (
              <div style={{ color: "white", fontSize: "20px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px" }}>
                🚿 {listing.bathrooms} bath
              </div>
            )}
            {sqft && (
              <div style={{ color: "white", fontSize: "20px", background: "rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px" }}>
                📐 {sqft}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>
          No agent commissions · nocomiss.com
        </div>
      </div>
    </div>,
    { ...size }
  );
}
