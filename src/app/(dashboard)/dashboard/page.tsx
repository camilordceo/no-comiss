import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Home,
  Eye,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCOP, getRelativeTime } from "@/lib/utils";
import type { Listing } from "@/lib/types/database";

export const metadata = { title: "Dashboard" };

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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: listings }, { data: recentLeads }, { data: profile }] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id, title, address, price, status, views_count, leads_count, photos, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("leads")
        .select("id, name, listing_id, status, source, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("profiles").select("full_name, subscription_tier").eq("id", user.id).single(),
    ]);

  const totalViews = listings?.reduce((s, l) => s + (l.views_count ?? 0), 0) ?? 0;
  const totalLeads = listings?.reduce((s, l) => s + (l.leads_count ?? 0), 0) ?? 0;
  const activeListings = listings?.filter((l) => l.status === "active").length ?? 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "vendedor";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hola, {firstName}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("es-CO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button asChild size="md">
          <Link href="/dashboard/listings/new">
            <Plus className="w-4 h-4" />
            Publicar inmueble
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Inmuebles activos",
            value: activeListings,
            icon: Home,
            sub: `${listings?.length ?? 0} total`,
          },
          {
            label: "Visitas totales",
            value: totalViews.toLocaleString("es-CO"),
            icon: Eye,
            sub: "últimos 30 días",
          },
          {
            label: "Leads recibidos",
            value: totalLeads.toLocaleString("es-CO"),
            icon: Users,
            sub: "compradores interesados",
          },
          {
            label: "Plan activo",
            value: profile?.subscription_tier
              ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
              : "Sin plan",
            icon: TrendingUp,
            sub: profile?.subscription_tier ? "activo" : "Activar ahora",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <div className="w-8 h-8 rounded-[8px] bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* My listings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mis inmuebles</CardTitle>
              <Link
                href="/dashboard/listings"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!listings || listings.length === 0 ? (
              <div className="text-center py-8">
                <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">
                  Aún no tienes inmuebles publicados
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard/listings/new">
                    <Plus className="w-3.5 h-3.5" />
                    Publicar mi primer inmueble
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {listings.map((listing) => (
                  <li key={listing.id}>
                    <Link
                      href={`/dashboard/listings/${listing.id}`}
                      className="flex items-center gap-3 p-2 rounded-[8px] hover:bg-surface transition-colors"
                    >
                      {listing.photos?.[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          className="w-12 h-12 rounded-[8px] object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-[8px] bg-surface flex items-center justify-center shrink-0">
                          <Home className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{listing.address}</p>
                        <p className="text-xs text-primary font-medium mt-0.5">
                          {formatCOP(listing.price)}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[listing.status]}>
                        {STATUS_LABELS[listing.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent leads */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Leads recientes</CardTitle>
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!recentLeads || recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Los compradores interesados aparecerán aquí
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center gap-3 p-2 rounded-[8px] hover:bg-surface transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {lead.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-gray-400">
                        {lead.source} · {getRelativeTime(lead.created_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        lead.status === "new"
                          ? "default"
                          : lead.status === "showing_scheduled"
                          ? "warning"
                          : lead.status === "closed"
                          ? "success"
                          : "neutral"
                      }
                    >
                      {lead.status === "new"
                        ? "Nuevo"
                        : lead.status === "contacted"
                        ? "Contactado"
                        : lead.status === "showing_scheduled"
                        ? "Visita"
                        : lead.status === "offer_made"
                        ? "Oferta"
                        : lead.status === "closed"
                        ? "Cerrado"
                        : "Perdido"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
