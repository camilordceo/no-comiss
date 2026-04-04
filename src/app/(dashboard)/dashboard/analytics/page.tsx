import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, Users, TrendingUp, Home } from "lucide-react";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, views_count, leads_count, status, price")
    .eq("user_id", user.id)
    .order("views_count", { ascending: false });

  const totalViews = listings?.reduce((s, l) => s + (l.views_count ?? 0), 0) ?? 0;
  const totalLeads = listings?.reduce((s, l) => s + (l.leads_count ?? 0), 0) ?? 0;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rendimiento de tus inmuebles</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Visitas totales", value: totalViews.toLocaleString("es-CO"), icon: Eye },
          { label: "Leads generados", value: totalLeads.toLocaleString("es-CO"), icon: Users },
          { label: "Tasa de conversión", value: `${conversionRate}%`, icon: TrendingUp },
          { label: "Inmuebles activos", value: listings?.filter((l) => l.status === "active").length ?? 0, icon: Home },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-listing breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Rendimiento por inmueble
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!listings || listings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Publica un inmueble para ver analytics.
            </p>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => {
                const conv = listing.views_count > 0
                  ? ((listing.leads_count / listing.views_count) * 100).toFixed(1)
                  : "0";
                const maxViews = Math.max(...(listings.map((l) => l.views_count) ?? [1]));
                const barWidth = maxViews > 0 ? (listing.views_count / maxViews) * 100 : 0;

                return (
                  <div key={listing.id}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate flex-1">
                        {listing.title}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0 ml-4">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {listing.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {listing.leads_count}
                        </span>
                        <span className="text-primary font-medium w-12 text-right">
                          {conv}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
