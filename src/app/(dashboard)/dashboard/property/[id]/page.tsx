import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Camera, Pencil } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailsForm } from "@/components/property/details-form";
import { StoryForm } from "@/components/property/story-form";
import { StatusActions } from "./status-actions";
import { STATUS_LABEL } from "@/lib/types/app";
import { formatPrice } from "@/lib/utils/format";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await requireDashboardSession();
  if (!session.profile.empresa_id) redirect("/dashboard");

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("propiedades")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", session.profile.empresa_id)
    .maybeSingle();

  if (!property) notFound();

  // Mid-onboarding properties belong in the wizard, not here.
  if (property.listing_status === "onboarding") {
    redirect(`/dashboard/property/new?id=${property.id}`);
  }

  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", id)
    .order("sort_order", { ascending: true });

  const photos = (media ?? []).filter((m) => m.media_type === "photo");
  const hero = photos.find((m) => m.is_hero) ?? photos[0] ?? null;
  const status = property.listing_status ?? "draft";
  const tab = sp.tab ?? "details";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">{STATUS_LABEL[status]}</Badge>
          <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
            {property.address_line1 ?? "Untitled property"}
          </h1>
          <p className="text-sm text-brand-muted">
            {property.ciudad}
            {property.state ? `, ${property.state}` : ""} {property.zip_code ?? ""}
            {" · "}
            {formatPrice(property.precio, property.currency ?? "USD")}
          </p>
        </div>
        <StatusActions propertyId={property.id} status={status} />
      </header>

      <div className="grid gap-4 sm:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-lg border border-brand-light-gray bg-brand-medium-gray">
          <div className="aspect-[4/3] w-full">
            {hero?.public_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.public_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-brand-muted">
                <Camera className="mr-2 h-4 w-4" /> No hero photo
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-brand-light-gray bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-brand-muted">
            Manage
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/property/${property.id}/photos`}>
                <Pencil className="h-4 w-4" /> Manage photos · {photos.length}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/property/${property.id}?tab=details`}>
                Edit details <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {property.slug ? (
            <p className="mt-4 text-xs text-brand-muted">
              Public slug: <code className="rounded bg-brand-medium-gray px-1.5 py-0.5">{property.slug}</code>
            </p>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <DetailsForm property={property} />
        </TabsContent>

        <TabsContent value="photos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">
                {photos.length} photo{photos.length === 1 ? "" : "s"} uploaded.
              </p>
              <Button asChild size="sm">
                <Link href={`/dashboard/property/${property.id}/photos`}>
                  Open photo manager <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {photos.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {photos.slice(0, 12).map((p) => (
                  <li
                    key={p.id}
                    className="aspect-square overflow-hidden rounded-md border border-brand-light-gray bg-brand-medium-gray stagger-item"
                  >
                    {p.public_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.public_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-brand-light-gray bg-brand-bg-alt p-12 text-center text-sm text-brand-muted">
                No photos yet. Open the photo manager to add some.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="story">
          <StoryForm property={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
