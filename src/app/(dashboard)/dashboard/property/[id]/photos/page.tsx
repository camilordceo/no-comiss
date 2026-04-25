import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PhotoManagerClient } from "./photo-manager-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function PhotoManagerPage({ params }: PageProps) {
  const { id } = await params;
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

  const { data: media } = await supabase
    .from("propiedad_media")
    .select("*")
    .eq("propiedad_id", id)
    .order("sort_order", { ascending: true });

  const photos = (media ?? []).filter((m) => m.media_type === "photo");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
          <Link href={`/dashboard/property/${property.id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to listing
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-brand-black md:text-3xl">
            Photos
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Drag to reorder. Click any photo to tag the room, set as hero, or add a caption.
          </p>
        </div>
      </div>

      <PhotoManagerClient
        property={property}
        empresaId={session.profile.empresa_id}
        initialPhotos={photos}
      />
    </div>
  );
}
