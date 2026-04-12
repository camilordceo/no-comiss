/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Home, Eye, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/utils";
import type { Listing } from "@/lib/types/database";

export const metadata = { title: "Mis inmuebles" };

const STATUS_LABELS: Record<Listing["status"], string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "Pausado",
  sold: "Vendido",
  expired: "Expirado",
};

const STATUS_VARIANTS: Record<Listing["status"], "default" | "success" | "warning" | "error" | "neutral"> = {
  draft: "neutral",
  active: "success",
  paused: "warning",
  sold: "default",
  expired: "error",
};

export default async function ListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis inmuebles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {listings?.length ?? 0} propiedades publicadas
          </p>
        </div>
        <Button asChild size="md">
          <Link href="/dashboard/listings/new">
            <Plus className="w-4 h-4" />
            Nuevo inmueble
          </Link>
        </Button>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="text-center py-20">
          <Home className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Publica tu primer inmueble
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            En 10 minutos tienes un listing profesional listo para atraer compradores.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard/listings/new">
              <Plus className="w-4 h-4" />
              Comenzar ahora
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/dashboard/listings/${listing.id}`}
              className="block"
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Photo */}
                <div className="h-44 bg-surface relative overflow-hidden">
                  {listing.photos?.[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant={STATUS_VARIANTS[listing.status]}>
                      {STATUS_LABELS[listing.status]}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <p className="font-semibold text-foreground truncate">{listing.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{listing.address}</p>
                  <p className="text-base font-bold text-primary mt-2">
                    {formatUSD(listing.price)}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {listing.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {listing.leads_count} leads
                    </span>
                    {listing.area_m2 && (
                      <span>{listing.area_m2} m²</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
