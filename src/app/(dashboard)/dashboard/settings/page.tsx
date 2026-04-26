import { requireDashboardSession } from "@/lib/hooks/use-session";
import { ProfileSettingsForm } from "./profile-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-6">
      <div>
        <div className="label-section mb-2">Cuenta</div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra tu perfil y avatar.
        </p>
      </div>

      <ProfileSettingsForm
        userId={session.userId}
        email={session.email}
        nombre={session.profile.nombre ?? ""}
        avatarUrl={session.profile.avatar_url ?? null}
      />
    </div>
  );
}
