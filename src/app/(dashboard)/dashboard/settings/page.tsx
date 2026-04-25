import { requireDashboardSession } from "@/lib/hooks/use-session";
import { ProfileSettingsForm } from "./profile-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-brand-black">Settings</h1>
        <p className="mt-1 text-sm text-brand-muted">Manage your profile.</p>
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
