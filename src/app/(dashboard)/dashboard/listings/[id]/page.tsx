/* eslint-disable @next/next/no-img-element */
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft, Eye, Users, ExternalLink, Sparkles,
  Bed, Bath, SquareStack, Calendar, MapPin, Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSD, getRelativeTime } from "@/lib/utils";
import type { Listing } from "@/lib/types/database";
import { ListingActions } from "./listing-actions";
import { SocialPostGenerator } from "@/components/listing/social-post-generator";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("title").eq("id", id).single();
  return { title: data?.title ? `${data.title} — NoComiss` : "Listing — NoComiss" };
}

const STATUS_LABELS: Record<Listing["status"], string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  sold: "Sold",
  expired: "Expired",
};

const STATUS_VARIANTS: Record<Listing["status"], "default" | "success" | "warning" | "error" | "neutral"> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  sold: "default",
  expired: "error",
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: listing }, { data: recentLeads }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("leads")
      .select("id, name, status, source, created_at")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!listing) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nocomiss.com";
  const publicUrl = `${appUrl}/homes/${listing.slug}`;
  const heroPhoto = listing.photos?.[listing.hero_photo_idx ?? 0] ?? listing.photos?.[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/listings"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-foreground transition-colors mt-0.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          All listings
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground truncate">{listing.title}</h1>
            <Badge variant={STATUS_VARIANTS[listing.status]}>{STATUS_LABELS[listing.status]}</Badge>
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {listing.address}{listing.city ? `, ${listing.city}` : ""}{listing.state ? `, ${listing.state}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ListingActions listing={listing} publicUrl={publicUrl} />
        </div>
      </div>

      {/* Hero photo + stats */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Photo */}
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden bg-surface aspect-video relative">
            {heroPhoto ? (
              <img src={heroPhoto} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                <SquareStack className="w-10 h-10" />
                <p className="text-sm">No photos yet</p>
              </div>
            )}
            {listing.photos?.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{listing.photos.length - 1} more
              </div>
            )}
          </div>
          {/* Photo strip */}
          {listing.photos?.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {listing.photos.slice(0, 8).map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-12 object-cover rounded-lg shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Price */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Asking price</p>
              <p className="text-3xl font-bold text-primary">{formatUSD(listing.price)}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                {listing.bedrooms && (
                  <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{listing.bedrooms} bd</span>
                )}
                {listing.bathrooms && (
                  <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{listing.bathrooms} ba</span>
                )}
                {listing.sqft && (
                  <span className="flex items-center gap-1"><SquareStack className="w-4 h-4" />{listing.sqft.toLocaleString()} sqft</span>
                )}
              </div>
              {listing.year_built && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Built {listing.year_built}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{listing.views_count ?? 0}</p>
                <p className="text-xs text-gray-400">Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{listing.leads_count ?? 0}</p>
                <p className="text-xs text-gray-400">Leads</p>
              </CardContent>
            </Card>
          </div>

          {/* Public link + QR code */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-2">Public listing URL</p>
              <div className="flex items-center gap-2 mb-3">
                <code className="flex-1 text-xs bg-surface rounded px-2 py-1.5 truncate text-gray-600">
                  {publicUrl.replace("https://", "")}
                </code>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </a>
              </div>
              {/* QR code */}
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=80x80&margin=4`}
                  alt="QR code for listing"
                  width={80}
                  height={80}
                  className="rounded-lg border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">QR code</p>
                  <p className="text-xs text-gray-400 mt-0.5">Print on a yard sign or flyer</p>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=400x400&margin=10`}
                    download={`${listing.slug}-qr.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                  >
                    <Copy className="w-3 h-3" /> Download high-res
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI CTA */}
          {listing.status === "draft" && (
            <Button asChild size="md" className="w-full">
              <Link href={`/dashboard/listings/${listing.id}/generate`}>
                <Sparkles className="w-4 h-4" />
                Generate AI description & publish
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Listing description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent leads */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent leads</CardTitle>
            <Link href="/dashboard/negociaciones" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!recentLeads || recentLeads.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No leads yet. Share your listing to get buyers interested.</p>
          ) : (
            <ul className="space-y-2">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{lead.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.source} · {getRelativeTime(lead.created_at)}</p>
                  </div>
                  <Badge variant={lead.status === "new" ? "default" : "neutral"}>
                    {lead.status === "new" ? "New" : lead.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Details grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Property details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Type", value: listing.property_type?.replace(/_/g, " ") },
              { label: "Bedrooms", value: listing.bedrooms },
              { label: "Bathrooms", value: listing.bathrooms },
              { label: "Sqft", value: listing.sqft?.toLocaleString() },
              { label: "Lot sqft", value: listing.lot_sqft?.toLocaleString() },
              { label: "Year built", value: listing.year_built },
              { label: "Garage", value: listing.garage_spaces ? `${listing.garage_spaces} cars` : null },
              { label: "HOA/mo", value: listing.hoa_monthly ? formatUSD(listing.hoa_monthly) : null },
            ].filter((d) => d.value != null).map((d) => (
              <div key={d.label}>
                <dt className="text-xs text-gray-400">{d.label}</dt>
                <dd className="text-sm font-medium text-foreground capitalize">{d.value}</dd>
              </div>
            ))}
          </dl>
          {listing.amenities?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-gray-400 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a: string) => (
                  <span key={a} className="text-xs bg-surface border border-border rounded-full px-2.5 py-1">{a}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Social Post Generator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Generate social media post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SocialPostGenerator listingId={listing.id} />
        </CardContent>
      </Card>

      {/* Published date */}
      <p className="text-xs text-gray-400">
        Created {getRelativeTime(listing.created_at)}
        {listing.published_at ? ` · Published ${getRelativeTime(listing.published_at)}` : ""}
      </p>
    </div>
  );
}
