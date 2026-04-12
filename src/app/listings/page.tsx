/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { formatUSD } from "@/lib/utils";
import { Bed, Bath, SquareStack, MapPin, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Homes for Sale — NoComiss | No Agent Commissions",
  description:
    "Browse homes for sale listed directly by owners. No 6% agent commission — verified listings with AI-powered descriptions and real-time pricing.",
};

export const revalidate = 300; // 5-minute ISR

interface SearchParams {
  city?: string;
  state?: string;
  type?: string;
  page?: string;
}

const PAGE_SIZE = 12;

function getServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function ListingsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = getServiceClient();

  let query = supabase
    .from("listings")
    .select("id, slug, title, address, city, state, price, bedrooms, bathrooms, sqft, area_m2, photos, property_type, created_at", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.city) query = query.ilike("city", `%${sp.city}%`);
  if (sp.state) query = query.eq("state", sp.state);
  if (sp.type) query = query.eq("property_type", sp.type as "single_family" | "condo" | "townhouse" | "multi_family" | "apartment" | "house" | "studio" | "commercial" | "land");

  const { data: listings, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const PROPERTY_TYPES = [
    { value: "single_family", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi_family", label: "Multi-Family" },
  ];

  function buildUrl(params: Record<string, string | undefined>) {
    const next = { ...sp, ...params };
    const qs = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/listings${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold text-foreground">
              No<span className="text-primary">Comiss</span>
            </Link>
            <p className="text-sm text-gray-500 hidden sm:block">
              {count ?? 0} homes for sale — no agent fees
            </p>
            <Link
              href="/start"
              className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              List your home free
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Homes for Sale</h1>
          <p className="text-gray-500 mt-1">
            Owner-listed properties — save up to 6% in agent commissions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Property type */}
          <div className="flex gap-2 flex-wrap">
            <Link
              href={buildUrl({ type: undefined, page: "1" })}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                !sp.type ? "bg-primary text-white border-primary" : "border-border text-gray-600 hover:border-primary"
              }`}
            >
              All types
            </Link>
            {PROPERTY_TYPES.map((pt) => (
              <Link
                key={pt.value}
                href={buildUrl({ type: pt.value, page: "1" })}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  sp.type === pt.value ? "bg-primary text-white border-primary" : "border-border text-gray-600 hover:border-primary"
                }`}
              >
                {pt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Grid */}
        {!listings || listings.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">No listings found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((listing) => {
              const sqft = listing.sqft ?? listing.area_m2;
              return (
                <Link
                  key={listing.id}
                  href={`/homes/${listing.slug}`}
                  className="group block rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] bg-surface overflow-hidden relative">
                    {listing.photos?.[0] ? (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SquareStack className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-medium text-primary px-2 py-0.5 rounded-full">
                      No commission
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xl font-bold text-primary">{formatUSD(listing.price)}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{listing.title}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {listing.address}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {listing.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" />{listing.bedrooms} bd
                        </span>
                      )}
                      {listing.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" />{listing.bathrooms} ba
                        </span>
                      )}
                      {sqft && (
                        <span className="flex items-center gap-1">
                          <SquareStack className="w-3.5 h-3.5" />{Number(sqft).toLocaleString()} sqft
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}

        {/* SEO blurb */}
        <div className="mt-16 border-t border-border pt-10 text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Sell your home without paying 6% commission
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            NoComiss lets homeowners list directly, reach qualified buyers, and keep more of their
            equity. Our AI writes your listing description, tracks leads, and schedules showings —
            all for a flat monthly fee instead of a 5–6% commission.
          </p>
          <Link
            href="/start"
            className="inline-block mt-4 text-sm font-medium bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            List your home — starts at $99/mo
          </Link>
        </div>
      </div>
    </div>
  );
}
