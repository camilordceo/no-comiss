import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Bell } from "lucide-react";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona tu cuenta y suscripción</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfileForm
            userId={user.id}
            initialData={{
              full_name: profile?.full_name ?? "",
              phone: profile?.phone ?? "",
              email: user.email ?? "",
            }}
          />
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Plan{" "}
                {profile?.subscription_tier
                  ? profile.subscription_tier.charAt(0).toUpperCase() +
                    profile.subscription_tier.slice(1)
                  : "Gratuito"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {profile?.subscription_status === "active"
                  ? "Activo · Se renueva el próximo mes"
                  : "Sin suscripción activa"}
              </p>
            </div>
            <Badge
              variant={
                profile?.subscription_status === "active" ? "success" : "neutral"
              }
            >
              {profile?.subscription_status === "active" ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          {profile?.subscription_status !== "active" && (
            <Button asChild size="md" className="w-full">
              <a href="/#precios">Activar suscripción</a>
            </Button>
          )}
          {profile?.subscription_status === "active" && (
            <Button variant="outline" size="md">
              Gestionar plan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[
              { label: "Nuevos leads por WhatsApp", description: "Recibe un mensaje cuando llegue un comprador" },
              { label: "Resumen semanal por email", description: "Visitas, leads y métricas de tus inmuebles" },
              { label: "Visitas confirmadas", description: "Recordatorio 24h antes de una visita agendada" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <button
                    className="w-10 h-6 rounded-full bg-primary transition-colors relative"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
                {i < 2 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
