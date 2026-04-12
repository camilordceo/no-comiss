import type { MetadataRoute } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nocomiss.com";

export const revalidate = 3600; // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Fetch all active listing slugs
  const { data: listings } = await supabase
    .from("listings")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const listingUrls: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${BASE_URL}/homes/${l.slug}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/start`,     changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/listings`,  changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/calculator`,changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`,      changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/login`,     changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`,    changeFrequency: "monthly", priority: 0.4 },
  ];

  return [...staticPages, ...listingUrls];
}
