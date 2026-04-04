import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RentCast not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const data = await res.json();
    const property = Array.isArray(data) ? data[0] : data;

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({
      address: property.addressLine1 ?? address,
      city: property.city ?? "",
      state: property.state ?? "",
      zipCode: property.zipCode ?? "",
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      squareFootage: property.squareFootage ?? null,
      yearBuilt: property.yearBuilt ?? null,
      estimatedValue: property.price ?? property.estimatedValue ?? null,
    });
  } catch (err) {
    console.error("RentCast lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
