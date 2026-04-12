import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import { ListingContactForm } from "@/components/listing/contact-form";
import { ListingGallery } from "@/components/listing/gallery";
import { MortgageCalculator } from "@/components/listing/mortgage-calculator";
import { ShareButtons } from "@/components/listing/share-buttons";
import {
  BedDouble, Bath, Car, Ruler, MapPin, Home, CheckCircle2, CalendarDays, Layers,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("title, description, photos, address, city, price")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!listing) return { title: "Home not found" };

  const desc = listing.description?.slice(0, 160) ?? `${listing.title} — ${listing.city}`;

  return {
    title: `${listing.title} | NoComiss`,
    description: desc,
    openGraph: {
      title: listing.title,
      description: desc,
      images: listing.photos?.[0] ? [{ url: listing.photos[0] }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: desc,
      images: listing.photos?.[0] ? [listing.photos[0]] : [],
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  // Increment views (fire-and-forget)
  supabase.from("listings").update({ views_count: (listing.views_count ?? 0) + 1 }).eq("id", listing.id).then(() => {});

  const l = listing as Record<string, unknown>;
  const aiDescriptions = listing.ai_descriptions as Array<{ type?: string; title: string; body: string }> | null;
  const selectedDescription = aiDescriptions?.[listing.selected_description_idx ?? 0];
  const displayDescription = selectedDescription?.body ?? listing.description ?? "";
  const sellerStory = l.seller_story as string | null;

  const sqft = (l.sqft as number | null) ?? listing.area_m2;
  const yearBuilt = l.year_built as number | null;
  const stories = l.stories as number | null;
  const videoUrl = listing.video_url;

  const specs = [
    listing.bedrooms != null   && { icon: BedDouble,    label: `${listing.bedrooms} bed` },
    listing.bathrooms != null  && { icon: Bath,          label: `${listing.bathrooms} bath` },
    sqft                       && { icon: Ruler,          label: `${Number(sqft).toLocaleString()} sqft` },
    listing.parking != null    && { icon: Car,            label: `${listing.parking} garage` },
    yearBuilt                  && { icon: CalendarDays,   label: `Built ${yearBuilt}` },
    stories != null            && { icon: Layers,         label: `${stories} stor${stories !== 1 ? "ies" : "y"}` },
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  const listingUrl = `https://no-comiss.vercel.app/homes/${slug}`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: displayDescription,
    url: listingUrl,
    image: listing.photos?.[0] ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: l.state ?? undefined,
      postalCode: l.zip_code ?? undefined,
      addressCountry: "US",
    },
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "USD",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Sticky header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
        <a href="/" className="font-bold text-lg">
          <span className="text-primary">No</span>Comiss
        </a>
        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-sm font-semibold text-foreground">{formatUSD(listing.price)}</p>
          <a
            href="#contact"
            className="h-9 px-4 rounded-[8px] bg-primary text-white text-sm font-medium flex items-center hover:bg-[#38c98d] active:scale-[0.98] transition-all"
          >
            Schedule Showing
          </a>
        </div>
      </header>

      {/* Gallery */}
      <ListingGallery photos={listing.photos ?? []} title={listing.title} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title + address + price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">{listing.title}</h1>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{listing.address}{listing.city ? `, ${listing.city}` : ""}{(l.state as string) ? `, ${l.state}` : ""}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatUSD(listing.price)}</p>
              {sqft && listing.price && (
                <p className="text-sm text-gray-400 mt-1">{formatUSD(Math.round(listing.price / Number(sqft)))}/sqft</p>
              )}
            </div>

            {/* Stats bar */}
            {specs.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {specs.map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-[8px] border border-border text-center">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs — About / Seller Story */}
            <div>
              {displayDescription && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedDescription?.title ?? "About this home"}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{displayDescription}</p>
                </div>
              )}
            </div>

            {/* Seller story */}
            {sellerStory && sellerStory !== displayDescription && (
              <div className="rounded-[12px] bg-[#f8f8f8] border border-border p-5">
                <h2 className="text-base font-semibold text-foreground mb-2">Seller&apos;s story</h2>
                <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{sellerStory}&rdquo;</p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Features</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {listing.amenities.map((a: string) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Video */}
            {videoUrl && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">Watch the home tour</h2>
                <div className="rounded-[12px] overflow-hidden border border-border bg-black aspect-video">
                  <video src={videoUrl} controls className="w-full h-full" preload="metadata" />
                </div>
              </div>
            )}

            {/* Mortgage calculator */}
            <MortgageCalculator price={listing.price} />

            {/* Share */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3">Share this home</h2>
              <ShareButtons url={listingUrl} title={listing.title} />
            </div>

            {/* NoComiss badge */}
            <div className="rounded-[12px] bg-[#f8f8f8] border border-border p-4 flex items-start gap-3">
              <Home className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Sold directly — no agent commission</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  This home is listed on NoComiss, an AI-powered platform that connects sellers and buyers
                  directly. NoComiss is a technology platform, not a licensed real estate broker.
                  Buyers are encouraged to conduct their own due diligence.
                </p>
              </div>
            </div>
          </div>

          {/* Contact sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20" id="contact">
              <ListingContactForm listingId={listing.id} userId={listing.user_id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
