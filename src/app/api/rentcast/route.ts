import { NextResponse } from "next/server";
import { lookupProperty, getAVM } from "@/lib/services/rentcast";
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  try {
    logger.info("api.rentcast.lookup", { address });

    const [property, avm] = await Promise.all([
      lookupProperty(address),
      getAVM(address),
    ]);

    if (!property) {
      return NextResponse.json({ property: null, avm: null });
    }

    // Merge AVM data into the property result
    const merged = {
      formattedAddress: property.formattedAddress,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      squareFootage: property.squareFootage ?? null,
      lotSize: property.lotSize ?? null,
      yearBuilt: property.yearBuilt ?? null,
      stories: property.stories ?? null,
      garage: property.garage ?? null,
      estimatedValue: avm?.price ?? null,
      priceRangeLow: avm?.priceRangeLow ?? null,
      priceRangeHigh: avm?.priceRangeHigh ?? null,
      comparables: avm?.comparables ?? [],
    };

    return NextResponse.json({ property: merged });
  } catch (err) {
    logger.error("api.rentcast.error", { address, error: String(err) });
    return NextResponse.json({ property: null, error: "Lookup failed" });
  }
}
