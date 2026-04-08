import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Video, MapPin, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Visitas agendadas" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "No se presentó",
};
const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "error" | "neutral"> = {
  pending: "warning",
  confirmed: "success",
  completed: "default",
  cancelled: "error",
  no_show: "neutral",
};

export default async function VisitasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("showings")
      .select("*, listings(title, address, photos)")
      .eq("seller_id", user.id)
      .gte("scheduled_at", now)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true })
      .limit(20),
    supabase
      .from("showings")
      .select("*, listings(title, address)")
      .eq("seller_id", user.id)
      .lt("scheduled_at", now)
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-CO", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function ShowingCard({ showing }: { showing: Record<string, unknown> }) {
    const listing = showing.listings as Record<string, unknown> | null;
    const photos = (listing?.photos as string[]) ?? [];

    return (
      <div className="flex gap-4 p-4 rounded-[10px] border border-border bg-white hover:border-primary/30 transition-colors">
        {/* Photo */}
        <div className="w-16 h-16 rounded-[8px] bg-surface shrink-0 overflow-hidden">
          {photos[0] ? (
            <img src={photos[0] as string} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground truncate">
              {(listing?.title as string) ?? "Inmueble"}
            </p>
            <Badge variant={STATUS_VARIANTS[showing.status as string] ?? "neutral"}>
              {STATUS_LABELS[showing.status as string] ?? showing.status as string}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span className="font-medium text-foreground">{showing.buyer_name as string}</span>
              {showing.buyer_phone && <span>· {showing.buyer_phone as string}</span>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDate(showing.scheduled_at as string)}</span>
            </div>
            {listing?.address && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{listing.address as string}</span>
              </div>
            )}
            {showing.google_meet_link && (
              <a
                href={showing.google_meet_link as string}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <Video className="w-3 h-3" />
                Unirse a Google Meet
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visitas agendadas</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestiona las visitas de compradores a tus inmuebles.
        </p>
      </div>

      {/* Upcoming */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Próximas visitas
            {(upcoming?.length ?? 0) > 0 && (
              <span className="ml-auto bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                {upcoming?.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {!upcoming || upcoming.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No tienes visitas agendadas</p>
              <p className="text-xs text-gray-400 mt-1">
                Cuando un comprador agende, aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            upcoming.map((s) => (
              <ShowingCard key={s.id as string} showing={s as Record<string, unknown>} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Past */}
      {past && past.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-500">Visitas pasadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {past.map((s) => (
              <ShowingCard key={s.id as string} showing={s as Record<string, unknown>} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
