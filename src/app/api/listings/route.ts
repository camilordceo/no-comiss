import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const {
    address,
    city,
    state,
    zip_code,
    neighborhood,
    property_type,
    price,
    // US fields
    sqft,
    lot_sqft,
    year_built,
    stories,
    garage_spaces,
    hoa_monthly,
    // shared
    bedrooms,
    bathrooms,
    parking,
    floor,
    stratum,
    area_m2,
    amenities,
    photos,
    photo_rooms,
    hero_photo_idx,
    video_url,
    seller_story,
    rentcast_data,
  } = body;

  // Build a clean title from the address
  const addressSlug = slugify(address ?? "home");
  const slug = `${addressSlug}-${Date.now()}`;

  const ptLabel: Record<string, string> = {
    single_family: "Home",
    condo: "Condo",
    townhouse: "Townhouse",
    multi_family: "Multi-Family",
    apartment: "Apartment",
    house: "House",
    studio: "Studio",
    commercial: "Commercial",
    land: "Land",
  };

  const cityLabel = city || state || "";
  const title = `${ptLabel[property_type] ?? "Home"} for Sale${cityLabel ? ` in ${cityLabel}` : ""}`;

  logger.info("listing.create", { userId: user.id, address, property_type });

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      slug,
      status: "draft",
      property_type: property_type ?? "single_family",
      title,
      description: seller_story ?? null,
      seller_story: seller_story ?? null,
      address,
      city: city ?? "",
      state: state ?? null,
      zip_code: zip_code ?? null,
      neighborhood: neighborhood ?? null,
      price: price ?? 0,
      sqft: sqft ?? null,
      lot_sqft: lot_sqft ?? null,
      year_built: year_built ?? null,
      stories: stories ?? null,
      garage_spaces: garage_spaces ?? null,
      hoa_monthly: hoa_monthly ?? null,
      area_m2: area_m2 ?? sqft ?? null,
      bedrooms: bedrooms ?? null,
      bathrooms: bathrooms ?? null,
      parking: parking ?? garage_spaces ?? null,
      floor: floor ?? null,
      stratum: stratum ?? null,
      amenities: amenities ?? [],
      photos: photos ?? [],
      photo_rooms: photo_rooms ?? [],
      hero_photo_idx: hero_photo_idx ?? 0,
      video_url: video_url ?? null,
      rentcast_data: rentcast_data ?? null,
      selected_description_idx: 0,
    })
    .select("id, slug")
    .single();

  if (error) {
    logger.error("listing.create.failed", { userId: user.id, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logger.info("listing.created", { userId: user.id, listingId: data.id, slug: data.slug });
  return NextResponse.json({ id: data.id, slug: data.slug });
}
