import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const city = searchParams.get("city");

  if (!address || !city) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    // Return mock data if no API key
    return NextResponse.json({
      mock: true,
      price_estimate: null,
      comps: [],
      market_stats: null,
    });
  }

  try {
    const fullAddress = `${address}, ${city}, Colombia`;
    const res = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(fullAddress)}`,
      {
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "RentCast error", status: res.status }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch from RentCast" }, { status: 500 });
  }
}
