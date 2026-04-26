import { requireDashboardSession } from "@/lib/hooks/use-session";
import { ProfileSettingsForm } from "./profile-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow eyebrow-coral mb-3">Terminal · Settings</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Your profile.</span>
        </h1>
        <p className="mt-2 text-sm text-text-2 md:text-base">
          Manage how buyers and the AI see you.
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
