import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "@/components/public/contact-form";
import { StickyTopbar } from "@/components/public/sticky-topbar";
import {
  formatNumber,
  formatPrice,
} from "@/lib/utils/format";
import type { Propiedad, PropiedadMedia } from "@/lib/types/database";

const PUBLIC_STATUSES = ["active", "under_offer", "sold"] as const;
type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}

interface Bundle {
  property: Propiedad;
  hero: PropiedadMedia | null;
}

async function getListing(slug: string): Promise<Bundle | null> {
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("propiedades")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!property) return null;
  if (!PUBLIC_STATUSES.includes(property.listing_status as PublicStatus)) return null;

  const { data: photos } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", property.id)
    .eq("media_type", "photo")
    .order("sort_order", { ascending: true });

  const heroList = (photos ?? []) as PropiedadMedia[];
  const hero = heroList.find((p) => p.is_hero) ?? heroList[0] ?? null;
  return { property: property as Propiedad, hero };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getListing(slug);
  if (!bundle) return { title: "Inquiry not found" };
  const { property, hero } = bundle;
  const title = `Reach out about ${property.address_line1 ?? "this home"}`;
  const description = "Send the homeowner a direct message. No agents.";
  return {
    title,
    description,
    alternates: { canonical: `/inquiry/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/inquiry/${slug}`,
      images: hero?.public_url ? [{ url: hero.public_url }] : [],
    },
    robots: { index: false, follow: true },
  };
}

export default async function InquiryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const bundle = await getListing(slug);
  if (!bundle) notFound();

  const { property, hero } = bundle;
  const cityState = [property.ciudad, property.state].filter(Boolean).join(", ");
  const priceLabel = formatPrice(property.precio, property.currency ?? "USD");

  const requestedMode = sp.mode === "showing" || sp.mode === "offer" ? sp.mode : "inquiry";

  return (
    <div className="min-h-screen bg-crema">
      <StickyTopbar ctaHref={`/homes/${slug}`} ctaLabel="View full listing" />

      <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-8 md:px-6 md:pt-12">
        <Link
          href={`/homes/${slug}`}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3 transition-colors hover:text-text"
        >
          View full listing <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>

        {/* ─── Summary card ─── */}
        <section className="mt-5 flex gap-4 border border-rule bg-ivory p-4 md:p-5">
          <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden bg-crema-2 md:w-36">
            {hero?.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.public_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-3">
                <Building2 className="h-6 w-6" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="truncate font-serif text-lg font-medium leading-tight text-text">
              {property.address_line1 ?? "Home"}
            </div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
              {cityState}
              {property.zip_code ? ` ${property.zip_code}` : ""}
            </div>
            <div className="pt-1 font-serif text-xl font-medium text-text">{priceLabel}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
              {property.habitaciones != null ? `${property.habitaciones} BD` : null}
              {property.habitaciones != null && property.banos != null ? " · " : null}
              {property.banos != null ? `${property.banos} BA` : null}
              {(property.habitaciones != null || property.banos != null) && property.sqft
                ? " · "
                : null}
              {property.sqft ? `${formatNumber(property.sqft)} SF` : null}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <ContactForm
            propertySlug={slug}
            defaultMode={requestedMode}
            origen="shared_link"
          />
        </section>

        <p className="mt-6 text-center text-xs text-text-3">
          Powered by{" "}
          <Link href="/" className="font-semibold text-text hover:text-coral">
            NoComiss
          </Link>
          . Not a licensed real estate broker.
        </p>
      </main>
    </div>
  );
}
