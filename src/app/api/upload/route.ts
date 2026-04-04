import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/services/storage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const listingId = (formData.get("listingId") as string) ?? "tmp";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const isVideo = file.type.startsWith("video/");
  const bucket = isVideo ? BUCKETS.LISTING_VIDEOS : BUCKETS.LISTING_PHOTOS;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
  const path = `${user.id}/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return NextResponse.json({ url: publicUrl });
}
