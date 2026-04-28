import { requireDashboardSession } from "@/lib/hooks/use-session";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "./profile-settings-form";
import { BillingSection } from "./billing-section";
import type { PaymentSource, WompiTransaction } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireDashboardSession();

  const supabase = await createClient();
  const [{ data: txRows }, { data: psRows }] = await Promise.all([
    supabase
      .from("wompi_transactions")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("payment_sources")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false }),
  ]);

  const transactions = (txRows ?? []) as WompiTransaction[];
  const paymentSources = (psRows ?? []) as PaymentSource[];

  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow eyebrow-coral mb-3">Terminal · Settings</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Your profile.</span>
        </h1>
        <p className="mt-2 text-sm text-text-2 md:text-base">
          Manage how buyers and the AI see you.
        </p>
      </div>

      <BillingSection
        plan={session.profile.subscription_plan ?? session.profile.plan}
        status={session.profile.subscription_status}
        nextBillingAt={session.profile.subscription_next_billing_at}
        transactions={transactions}
        paymentSources={paymentSources}
      />

      <ProfileSettingsForm
        userId={session.userId}
        email={session.email}
        nombre={session.profile.nombre ?? ""}
        avatarUrl={session.profile.avatar_url ?? null}
      />
    </div>
  );
}
