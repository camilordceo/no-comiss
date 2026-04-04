import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils";
import { ListingContactForm } from "@/components/listing/contact-form";
import { ListingGallery } from "@/components/listing/gallery";
import {
  BedDouble,
  Bath,
  Car,
  Ruler,
  MapPin,
  Home,
  CheckCircle2,
  Phone,
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

  if (!listing) return { title: "Inmueble no encontrado" };

  return {
    title: listing.title,
    description: listing.description?.slice(0, 160) ?? `${listing.title} en ${listing.city}`,
    openGraph: {
      title: listing.title,
      description: listing.description?.slice(0, 160) ?? "",
      images: listing.photos?.[0] ? [{ url: listing.photos[0] }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.description?.slice(0, 160) ?? "",
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

  // Increment views (fire and forget)
  supabase
    .from("listings")
    .update({ views_count: (listing.views_count ?? 0) + 1 })
    .eq("id", listing.id)
    .then(() => {});

  const aiDescriptions = listing.ai_descriptions as Array<{ title: string; body: string }> | null;
  const selectedDescription = aiDescriptions?.[listing.selected_description_idx ?? 0];
  const displayDescription = selectedDescription?.body ?? listing.description ?? "";

  const specs = [
    listing.bedrooms && { icon: BedDouble, label: `${listing.bedrooms} hab.` },
    listing.bathrooms && { icon: Bath, label: `${listing.bathrooms} baños` },
    listing.parking && { icon: Car, label: `${listing.parking} parq.` },
    listing.area_m2 && { icon: Ruler, label: `${listing.area_m2} m²` },
  ].filter(Boolean) as { icon: React.ElementType; label: string }[];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-white/90 backdrop-blur-sm">
        <a href="/" className="font-bold text-lg">
          <span className="text-primary">No</span>Comiss
        </a>
        <a
          href="tel:+573000000000"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <Phone className="w-4 h-4" />
          Llamar
        </a>
      </header>

      {/* Gallery */}
      <ListingGallery photos={listing.photos ?? []} title={listing.title} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title + price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>
                  {listing.address}
                  {listing.neighborhood ? `, ${listing.neighborhood}` : ""},{" "}
                  {listing.city}
                </span>
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatCOP(listing.price)}
              </p>
              {listing.stratum && (
                <p className="text-xs text-gray-400 mt-1">Estrato {listing.stratum}</p>
              )}
            </div>

            {/* Specs */}
            {specs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specs.map(({ icon: Icon, label }, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-[8px] border border-border text-center"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {displayDescription && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  {selectedDescription?.title ?? "Descripción"}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {displayDescription}
                </p>
              </div>
            )}

            {/* Amenities */}
            {listing.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Amenidades
                </h2>
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

            {/* NoComiss badge */}
            <div className="rounded-[12px] bg-surface border border-border p-4 flex items-start gap-3">
              <Home className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Venta directa sin intermediarios
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Este inmueble se vende con NoComiss — tecnología IA que conecta vendedores y compradores
                  directamente, sin comisiones de agente.
                </p>
              </div>
            </div>
          </div>

          {/* Contact form — sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <ListingContactForm listingId={listing.id} userId={listing.user_id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
