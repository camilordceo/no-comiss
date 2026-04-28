import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import {
  amountInCents,
  formatCop,
  formatUsd,
  getPlan,
  usdTotal,
  USD_TO_COP_RATE,
} from "@/lib/services/wompi";
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

  const amount = amountInCents(plan, "upfront");
  const cop = amount / 100;
  const usd = usdTotal(plan, "upfront");

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
          <span className="italic">{plan.name} Plan — 3 months.</span>
        </h1>
        <p className="mt-3 text-sm text-text-2 md:text-base">
          One charge today. We&apos;ll keep your ads running, the AI answering buyers, and the
          Terminal updated.
        </p>
      </header>

      <section className="border border-rule bg-ivory p-7">
        <div className="eyebrow mb-4">Order summary</div>
        <ul className="space-y-3">
          <li className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-text">
              {plan.name} Plan × 3 months
            </span>
            <span className="font-mono text-[12px] tracking-[0.08em] text-text">
              {formatUsd(usd)}
            </span>
          </li>
          <li className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-text-3">
              Billed in COP at ~{USD_TO_COP_RATE.toLocaleString("en-US")} / USD
            </span>
            <span className="font-mono text-[11px] tracking-[0.08em] text-text-2">
              {formatCop(cop)}
            </span>
          </li>
        </ul>
        <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-rule pt-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-2">
            Total today
          </span>
          <span className="font-serif text-2xl font-medium text-text">{formatUsd(usd)}</span>
        </div>
        <p className="mt-3 text-xs text-text-3">
          Then nothing until you choose to renew.
        </p>
      </section>

      <CheckoutForm
        plan={{
          id: plan.id,
          name: plan.name,
          usdTotal: usd,
          copAmount: cop,
          amountInCents: amount,
        }}
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
