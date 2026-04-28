import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  PaymentSource,
  SubscriptionStatus,
  WompiTransaction,
} from "@/lib/types/database";
import { PLANS, formatUsd, USD_TO_COP_RATE } from "@/lib/services/wompi";
import { CancelSubscriptionButton } from "./cancel-subscription-button";

interface Props {
  plan: string | null;
  status: SubscriptionStatus | null;
  nextBillingAt: string | null;
  transactions: WompiTransaction[];
  paymentSources: PaymentSource[];
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  none: "No plan",
  trial: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  none: "status-draft",
  trial: "status-ready",
  active: "status-active",
  past_due: "status-paused",
  cancelled: "status-draft",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTransactionAmount(tx: WompiTransaction): string {
  const cop = tx.amount_in_cents / 100;
  const usd = Math.round(cop / USD_TO_COP_RATE);
  return `${formatUsd(usd)}`;
}

function txStatusClass(status: WompiTransaction["status"]): string {
  switch (status) {
    case "APPROVED":
      return "status-sold";
    case "DECLINED":
    case "ERROR":
      return "status-paused";
    case "VOIDED":
      return "status-draft";
    default:
      return "status-ready";
  }
}

export function BillingSection({
  plan,
  status,
  nextBillingAt,
  transactions,
  paymentSources,
}: Props) {
  const effectiveStatus: SubscriptionStatus = status ?? "none";
  const planName = plan && plan in PLANS ? PLANS[plan as keyof typeof PLANS].name : null;
  const isActive = effectiveStatus === "active";
  const isPastDue = effectiveStatus === "past_due";
  const showUpsell = !planName || effectiveStatus === "none" || effectiveStatus === "cancelled";

  const defaultCard =
    paymentSources.find((p) => p.is_default) ?? paymentSources[0] ?? null;

  return (
    <section className="space-y-5">
      <div className="border border-rule bg-ivory p-7">
        <div className="eyebrow mb-4">Billing &amp; plan</div>

        {showUpsell ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-medium leading-tight text-text">
              You&apos;re on the free tier.
            </h2>
            <p className="text-sm text-text-2">
              Pick a plan to unlock the AI listing engine, paid ad spend, and the buyer
              concierge.
            </p>
            <div>
              <Button asChild variant="spark">
                <Link href="/dashboard/subscribe">
                  Choose a plan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                  Current plan
                </p>
                <h2 className="mt-1 font-serif text-2xl font-medium leading-tight text-text">
                  {planName ?? plan}
                </h2>
              </div>
              <div className={`status-badge ${STATUS_BADGE[effectiveStatus]}`}>
                {STATUS_LABEL[effectiveStatus]}
              </div>
            </div>

            <p className="text-sm text-text-2">
              {isActive
                ? `Active until ${formatDate(nextBillingAt)}.`
                : isPastDue
                ? "Your last payment failed. Update your card to keep access."
                : `Plan ended ${formatDate(nextBillingAt)}.`}
            </p>

            <div className="flex flex-wrap gap-3 border-t border-rule pt-5">
              <Button asChild variant="spark">
                <Link href="/dashboard/subscribe">Upgrade plan</Link>
              </Button>
              {effectiveStatus === "active" || effectiveStatus === "past_due" ? (
                <CancelSubscriptionButton />
              ) : null}
            </div>
          </div>
        )}
      </div>

      {defaultCard ? (
        <div className="border border-rule bg-ivory p-7">
          <div className="eyebrow mb-4">Payment method</div>
          <div className="flex items-center gap-4">
            <CreditCard className="h-5 w-5 text-text-2" aria-hidden />
            <div>
              <p className="font-mono text-[12px] tracking-[0.08em] text-text">
                {defaultCard.card_brand ?? "CARD"} ···· {defaultCard.card_last_four ?? "····"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                Added {formatDate(defaultCard.created_at)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {transactions.length > 0 ? (
        <div className="border border-rule bg-ivory p-7">
          <div className="eyebrow mb-4">Billing history</div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                  <th className="py-2 text-left font-normal">Date</th>
                  <th className="py-2 text-left font-normal">Plan</th>
                  <th className="py-2 text-right font-normal">Amount</th>
                  <th className="py-2 text-right font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-rule/60 last:border-0">
                    <td className="py-3 text-text-2">{formatDate(tx.created_at)}</td>
                    <td className="py-3 text-text">
                      {tx.plan
                        ? (PLANS[tx.plan as keyof typeof PLANS]?.name ?? tx.plan)
                        : "—"}
                    </td>
                    <td className="py-3 text-right font-mono text-[12px] text-text">
                      {formatTransactionAmount(tx)}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`status-badge ${txStatusClass(tx.status)}`}>
                        {tx.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
