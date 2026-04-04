import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    address,
    city,
    neighborhood,
    property_type,
    price,
    area_m2,
    bedrooms,
    bathrooms,
    parking,
    floor,
    stratum,
    amenities,
    photos,
    story,
    rentcast_data,
  } = body;

  const slug = `${slugify(address)}-${slugify(city)}-${Date.now()}`;
  const title = `${property_type === "apartment" ? "Apartamento" : property_type === "house" ? "Casa" : "Inmueble"} en ${neighborhood || city}`;

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      slug,
      status: "draft",
      property_type,
      title,
      description: story,
      address,
      city,
      neighborhood: neighborhood || null,
      price,
      area_m2,
      bedrooms,
      bathrooms,
      parking,
      floor: floor || null,
      stratum: stratum || null,
      amenities: amenities || [],
      photos: photos || [],
      rentcast_data: rentcast_data || null,
      selected_description_idx: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
