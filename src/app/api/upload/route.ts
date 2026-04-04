import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    // Dev fallback: use Supabase Storage instead
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `listings/${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("photos")
      .upload(path, file, { upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  }

  // Cloudinary upload
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Math.round(Date.now() / 1000).toString();
  const paramsToSign = `folder=nocomiss/listings&timestamp=${timestamp}&upload_preset=nocomiss`;
  const crypto = await import("crypto");
  const signature = crypto
    .createHash("sha256")
    .update(`${paramsToSign}${apiSecret}`)
    .digest("hex");

  const cloudForm = new FormData();
  cloudForm.append("file", new Blob([buffer]), file.name);
  cloudForm.append("api_key", apiKey);
  cloudForm.append("timestamp", timestamp);
  cloudForm.append("signature", signature);
  cloudForm.append("folder", "nocomiss/listings");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: cloudForm }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: "Cloudinary upload failed", detail: err }, { status: 500 });
  }

  const result = await res.json();
  return NextResponse.json({ url: result.secure_url });
}
