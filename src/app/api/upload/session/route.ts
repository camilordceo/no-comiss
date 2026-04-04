import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

function getServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file || !sessionId) {
      return NextResponse.json({ error: "file and sessionId are required" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `sessions/${sessionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("session upload error:", error.message);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("listing-photos")
      .getPublicUrl(fileName);

    return NextResponse.json({ ok: true, url: urlData.publicUrl, path: fileName });
  } catch (err) {
    console.error("session upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
