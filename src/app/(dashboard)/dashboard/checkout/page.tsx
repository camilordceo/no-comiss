import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { amountInCents, getPlan, usdTotal } from "@/lib/services/wompi";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ plan?: string; mode?: string }>;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await requireDashboardSession();
  const params = await searchParams;
  const plan = getPlan(params.plan ?? "");
  if (!plan) {
    redirect("/dashboard/subscribe");
  }

  const initialMode: "upfront" | "monthly" =
    params.mode === "monthly" ? "monthly" : "upfront";

  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard/subscribe"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3 hover:text-text"
        >
          <ArrowLeft className="h-3 w-3" /> Back to plans
        </Link>
      </div>

      <header className="max-w-2xl">
        <div className="eyebrow eyebrow-coral mb-3">Payment</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">{plan.name} Plan.</span>
        </h1>
        <p className="mt-3 text-sm text-text-2 md:text-base">
          Pick a billing rhythm. The AI listing engine, paid ads, and lead concierge run
          either way.
        </p>
      </header>

      <CheckoutForm
        plan={{
          id: plan.id,
          name: plan.name,
          usdMonthly: plan.usd_per_month,
          usdUpfrontTotal: usdTotal(plan, "upfront"),
          copUpfront: amountInCents(plan, "upfront") / 100,
          copMonthly: amountInCents(plan, "monthly") / 100,
          amountUpfrontCents: amountInCents(plan, "upfront"),
          amountMonthlyCents: amountInCents(plan, "monthly"),
        }}
        initialMode={initialMode}
        wompiPublicKey={publicKey}
        wompiBaseUrl={
          process.env.NEXT_PUBLIC_WOMPI_BASE_URL ?? "https://sandbox.wompi.co/v1"
        }
        userEmail={session.email}
      />
    </div>
  );
}

export function generateMetadata() {
  return {
    title: `Checkout — NoComiss`,
    robots: { index: false, follow: false },
  };
}
