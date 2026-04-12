/* eslint-disable @next/next/no-img-element */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Handshake, ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, getRelativeTime } from "@/lib/utils";

export const metadata = { title: "Negociaciones" };

const STATUS_LABELS: Record<string, string> = {
  inquiry: "Consulta",
  showing_scheduled: "Visita agendada",
  showing_done: "Visita realizada",
  offer_made: "Oferta recibida",
  countered: "Contraoferta",
  accepted: "Aceptada",
  due_diligence: "Due diligence",
  closed_won: "Cerrado ✅",
  closed_lost: "No concretado",
};
const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "error" | "neutral"> = {
  inquiry: "neutral",
  showing_scheduled: "warning",
  showing_done: "warning",
  offer_made: "default",
  countered: "default",
  accepted: "success",
  due_diligence: "success",
  closed_won: "success",
  closed_lost: "error",
};

// Simple pipeline stages for visual progress
const PIPELINE_STAGES = [
  "inquiry",
  "showing_scheduled",
  "offer_made",
  "accepted",
  "closed_won",
];

function PipelineBar({ status }: { status: string }) {
  const currentIdx = PIPELINE_STAGES.indexOf(status);
  const progressIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="flex items-center gap-1 mt-2">
      {PIPELINE_STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1 flex-1">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= progressIdx ? "bg-primary" : "bg-border"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export default async function NegociacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: negotiations } = await supabase
    .from("negotiations")
    .select(`
      id, status, initial_offer, final_price, created_at, updated_at,
      seller_notes,
      listings(title, address, price, photos),
      buyer_profiles(name, email, phone),
      showings(scheduled_at, status)
    `)
    .eq("seller_id", user.id)
    .order("updated_at", { ascending: false });

  const active = negotiations?.filter((n) =>
    !["closed_won", "closed_lost"].includes(n.status)
  ) ?? [];
  const closed = negotiations?.filter((n) =>
    ["closed_won", "closed_lost"].includes(n.status)
  ) ?? [];

  const totalValue = active.reduce((sum, n) => {
    const raw = n as unknown as Record<string, unknown>;
    const listing = raw.listings as Record<string, unknown> | null ?? null;
    return sum + ((listing?.price as number) ?? 0);
  }, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Negociaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Sigue el estado de cada proceso de venta.
          </p>
        </div>
        {active.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Valor en pipeline</p>
            <p className="text-xl font-bold text-primary">{formatUSD(totalValue)}</p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Activas", value: active.length, icon: Handshake, color: "text-primary" },
          {
            label: "Con oferta",
            value: active.filter((n) => ["offer_made", "countered", "accepted"].includes(n.status)).length,
            icon: TrendingUp,
            color: "text-amber-500",
          },
          {
            label: "Cerradas",
            value: closed.filter((n) => n.status === "closed_won").length,
            icon: ArrowRight,
            color: "text-green-500",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-surface flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active negotiations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Negociaciones activas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {active.length === 0 ? (
            <div className="text-center py-10">
              <Handshake className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No hay negociaciones activas</p>
              <p className="text-xs text-gray-400 mt-1">
                Cuando un comprador muestre interés, aparecerá aquí.
              </p>
            </div>
          ) : (
            active.map((n) => {
              const raw = n as unknown as Record<string, unknown>;
              const listing = raw.listings as Record<string, unknown> | null ?? null;
              const buyer = raw.buyer_profiles as Record<string, unknown> | null ?? null;
              const photos = listing?.photos as string[] ?? [];
              const listingTitle = listing?.title as string ?? "Inmueble";
              const listingPrice = listing?.price as number | undefined;
              const buyerName = buyer?.name as string ?? "Comprador desconocido";
              const buyerPhone = buyer?.phone as string | undefined;

              return (
                <div
                  key={n.id}
                  className="p-4 rounded-[10px] border border-border bg-white hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[8px] bg-surface shrink-0 overflow-hidden">
                      {photos[0] ? (
                        <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {listingTitle}
                        </p>
                        <Badge variant={STATUS_VARIANTS[n.status] ?? "neutral"}>
                          {STATUS_LABELS[n.status] ?? n.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {buyerName}{buyerPhone ? ` · ${buyerPhone}` : ""}
                      </p>
                      {n.initial_offer && (
                        <p className="text-xs text-foreground">
                          Oferta inicial:{" "}
                          <span className="font-semibold text-primary">
                            {formatUSD(n.initial_offer)}
                          </span>
                          {listingPrice ? (
                            <span className="text-gray-400 ml-1">
                              (precio: {formatUSD(listingPrice)})
                            </span>
                          ) : null}
                        </p>
                      )}
                      <PipelineBar status={n.status} />
                      <p className="text-xs text-gray-400 mt-1.5">
                        Actualizado {getRelativeTime(n.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Closed */}
      {closed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-500">Cerradas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {closed.map((n) => {
              const raw = n as unknown as Record<string, unknown>;
              const listing = raw.listings as Record<string, unknown> | null ?? null;
              const buyer = raw.buyer_profiles as Record<string, unknown> | null ?? null;
              const listingTitle = listing?.title as string ?? "Inmueble";
              const buyerName = buyer?.name as string | undefined;
              return (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-3 rounded-[8px] border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {listingTitle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {buyerName ?? "—"} · {getRelativeTime(n.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {n.final_price && (
                      <span className="text-sm font-semibold text-foreground">
                        {formatUSD(n.final_price)}
                      </span>
                    )}
                    <Badge variant={STATUS_VARIANTS[n.status] ?? "neutral"}>
                      {STATUS_LABELS[n.status]}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
