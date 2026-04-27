import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Bath, BedDouble, Building2, Car, Ruler } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/public/contact-form";
import { PhotoLightbox } from "@/components/public/photo-lightbox";
import { MortgageCalculator } from "@/components/public/mortgage-calculator";
import { ShareButtons } from "@/components/public/share-buttons";
import { ListingTabs } from "@/components/public/listing-tabs";
import { StickyTopbar } from "@/components/public/sticky-topbar";
import {
  formatNumber,
  formatPrice,
  formatSqft,
  propertyTypeLabel,
} from "@/lib/utils/format";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

const PUBLIC_STATUSES = ["active", "under_offer", "sold"] as const;
type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ListingBundle {
  property: Propiedad;
  media: PropiedadMedia[];
  hero: PropiedadMedia | null;
  photos: PropiedadMedia[];
  videos: PropiedadMedia[];
}

async function getListing(slug: string): Promise<ListingBundle | null> {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("propiedades")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!property) return null;
  if (!PUBLIC_STATUSES.includes(property.listing_status as PublicStatus)) return null;

  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", property.id)
    .order("sort_order", { ascending: true });

  const allMedia = (media ?? []) as PropiedadMedia[];
  const photos = allMedia.filter((m) => m.media_type === "photo");
  const videos = allMedia.filter((m) => m.media_type === "video");
  const hero = photos.find((m) => m.is_hero) ?? photos[0] ?? null;

  return { property: property as Propiedad, media: allMedia, hero, photos, videos };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getListing(slug);
  if (!bundle) return { title: "Listing not found" };
  const { property, hero } = bundle;

  const cityState = [property.ciudad, property.state].filter(Boolean).join(", ");
  const headline = `${property.address_line1 ?? "Home"} · ${cityState}`;
  const priceLabel = formatPrice(property.precio, property.currency ?? "USD");
  const title = `${headline} — ${priceLabel}`;
  const description =
    property.description_short?.trim() ||
    property.descripcion?.trim().slice(0, 160) ||
    "Sold direct by the homeowner. No 6% commission.";

  return {
    title,
    description,
    alternates: { canonical: `/homes/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/homes/${slug}`,
      images: hero?.public_url ? [{ url: hero.public_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: hero?.public_url ? [hero.public_url] : [],
    },
  };
}

export default async function HomePublicPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getListing(slug);
  if (!bundle) notFound();

  const { property, hero, photos, videos } = bundle;
  const cityState = [property.ciudad, property.state].filter(Boolean).join(", ");
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://no-comiss.vercel.app"}/homes/${slug}`;
  const fullAddress = [property.address_line1, property.ciudad, property.state, property.zip_code]
    .filter(Boolean)
    .join(", ");
  const priceLabel = formatPrice(property.precio, property.currency ?? "USD");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.address_line1 ?? "Home",
    description: property.descripcion ?? property.description_short ?? "",
    url: baseUrl,
    image: hero?.public_url,
    datePosted: property.published_at ?? property.created_at,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address_line1,
      addressLocality: property.ciudad,
      addressRegion: property.state,
      postalCode: property.zip_code,
      addressCountry: property.country ?? "US",
    },
    offers: property.precio
      ? {
          "@type": "Offer",
          price: property.precio,
          priceCurrency: property.currency ?? "USD",
          availability:
            property.listing_status === "sold"
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
        }
      : undefined,
    numberOfRooms: property.habitaciones,
    numberOfBathroomsTotal: property.banos,
    floorSize: property.sqft
      ? { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-crema">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StickyTopbar />

      {/* ─── Hero ─── */}
      <section className="relative w-full bg-espresso">
        <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden md:h-[60vh]">
          {hero?.public_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.public_url}
              alt={property.address_line1 ?? "Home"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-on-dark/30">
              <Building2 className="h-12 w-12" aria-hidden />
            </div>
          )}
          <div className="absolute bottom-5 left-5 max-w-[90%] rounded-sm bg-ivory/95 px-4 py-3 backdrop-blur-sm md:bottom-7 md:left-7 md:px-5 md:py-4">
            <div className="font-serif text-2xl font-medium leading-none text-text md:text-3xl">
              {priceLabel}
            </div>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-3">
              {property.habitaciones != null ? `${property.habitaciones} BD` : null}
              {property.habitaciones != null && property.banos != null ? " · " : null}
              {property.banos != null ? `${property.banos} BA` : null}
              {(property.habitaciones != null || property.banos != null) && property.sqft
                ? " · "
                : null}
              {property.sqft ? `${formatNumber(property.sqft)} SF` : null}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 md:px-8 md:pt-14">
        {/* ─── Address + headline ─── */}
        <section className="space-y-3">
          <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.01em] text-text">
            {property.address_line1 ?? "Home"}
          </h1>
          <p className="font-sans text-base text-text-2 md:text-lg">
            {cityState}
            {property.zip_code ? ` ${property.zip_code}` : ""}
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-text-2">
            {property.habitaciones != null ? <Stat icon={BedDouble} label={`${property.habitaciones} beds`} /> : null}
            {property.banos != null ? <Stat icon={Bath} label={`${property.banos} baths`} /> : null}
            {property.sqft ? <Stat icon={Ruler} label={formatSqft(property.sqft)} /> : null}
            {property.year_built ? <Stat icon={Building2} label={`Built ${property.year_built}`} /> : null}
            {(property.garage_spaces ?? property.parqueaderos) != null ? (
              <Stat icon={Car} label={`${property.garage_spaces ?? property.parqueaderos} garage`} />
            ) : null}
            {property.tipo_inmueble ? (
              <li className="flex items-center gap-1.5 text-text-3">
                {propertyTypeLabel(property.tipo_inmueble)}
              </li>
            ) : null}
          </ul>
        </section>

        {/* ─── Tabbed copy ─── */}
        <section className="mt-10">
          <ListingTabs
            description={property.descripcion}
            sellerStory={property.seller_story}
            city={property.ciudad}
            state={property.state}
          />
        </section>

        {/* ─── Photo gallery ─── */}
        {photos.length > 0 ? (
          <section className="mt-14 space-y-4">
            <div className="eyebrow">Photo gallery · {photos.length} photos</div>
            <PhotoLightbox photos={photos} />
          </section>
        ) : null}

        {/* ─── Video tour ─── */}
        {videos.length > 0 ? (
          <section className="mt-14 space-y-4">
            <div className="eyebrow">Video tour</div>
            <ul className="space-y-4">
              {videos.map((v) => (
                <li key={v.id} className="overflow-hidden border border-rule bg-espresso">
                  {v.public_url ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video
                      src={v.public_url}
                      controls
                      preload="metadata"
                      poster={v.thumbnail_url ?? undefined}
                      className="aspect-video w-full bg-espresso"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── Mortgage ─── */}
        {property.precio ? (
          <section className="mt-14">
            <MortgageCalculator basePrice={property.precio} />
          </section>
        ) : null}

        {/* ─── Contact form ─── */}
        <section id="contact" className="mt-14 scroll-mt-20">
          <ContactForm propertySlug={slug} origen="mini_site" />
        </section>

        {/* ─── Share ─── */}
        <section className="mt-14">
          <div className="eyebrow mb-3">Share this listing</div>
          <ShareButtons baseUrl={baseUrl} title={`${property.address_line1 ?? "Home"} — ${priceLabel}`} />
        </section>
      </main>

      <footer className="border-t border-rule bg-ivory py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 text-xs leading-relaxed text-text-3 md:px-8">
          <p>
            <span className="font-mono font-semibold uppercase tracking-[0.14em] text-text-2">NoComiss</span>{" "}
            is a technology platform — not a licensed real estate broker. We
            don&apos;t represent buyers or sellers. Information is provided by the
            homeowner; verify before relying on it. Not legal, financial, or tax
            advice.
          </p>
          <p className="text-text-3">
            {fullAddress ? <span>{fullAddress} · </span> : null}
            © {new Date().getFullYear()} Rentmies Inc.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
            <Link href="/" className="hover:text-text">
              ← Back to NoComiss
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon: Icon, label }: { icon: typeof BedDouble; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-text-2">
      <Icon className="h-3.5 w-3.5 text-text-3" aria-hidden />
      {label}
    </li>
  );
}
