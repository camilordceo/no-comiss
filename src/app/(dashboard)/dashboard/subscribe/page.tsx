import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { Button } from "@/components/ui/button";
import { PLAN_LIST, formatUsd } from "@/lib/services/wompi";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

const POPULAR_PLAN = "pro" as const;

export default async function SubscribePage() {
  const session = await requireDashboardSession();
  const currentPlan = session.profile.subscription_plan ?? session.profile.plan;

  return (
    <div className="space-y-12">
      <header className="max-w-3xl">
        <div className="eyebrow eyebrow-coral mb-3">Choose your plan</div>
        <h1 className="font-serif text-[clamp(2rem,5vw,2.75rem)] font-medium leading-tight tracking-[-0.01em] text-text">
          <span className="italic">Start selling your home.</span>
        </h1>
        <p className="mt-3 text-sm text-text-2 md:text-base">
          Three months upfront — keep the AI running, the ads spending, and the leads coming.
          Cancel anytime after the period ends.
        </p>
      </header>

      <section className="grid gap-3 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const isPopular = plan.id === POPULAR_PLAN;
          const isCurrent = currentPlan === plan.id;
          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col border bg-ivory p-7",
                isPopular ? "border-coral" : "border-rule",
              )}
            >
              {isPopular ? (
                <div className="absolute -top-3 left-7">
                  <span className="status-badge status-active">Most popular</span>
                </div>
              ) : null}

              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-text-2">
                  {plan.name}
                </h2>
                {isCurrent ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">
                    Current
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <div className="font-serif text-[3.5rem] font-medium leading-none tracking-[-0.02em] text-text">
                  {formatUsd(plan.usd_per_month)}
                  <span className="ml-2 font-mono text-[11px] tracking-[0.14em] text-text-3">
                    / mo
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
                  3 months upfront · {formatUsd(plan.usd_per_month * 3)}
                </p>
              </div>

              <ul className="mt-6 space-y-3 border-t border-rule pt-5">
                {plan.highlights.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-text-2">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-espresso"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-1">
                <Button asChild variant={isPopular ? "spark" : "ghost"} className="w-full">
                  <Link href={`/dashboard/checkout?plan=${plan.id}`}>
                    Select <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="border border-espresso bg-espresso p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <div>
            <div className="eyebrow text-coral">✦ AI Insight</div>
          </div>
          <div>
            <p className="font-serif text-2xl font-medium italic leading-snug text-text-on-dark md:text-3xl">
              The Pro plan pays for itself the moment it shaves a week off market.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-text-on-dark-2">
              On a $400K home, one extra week on market costs roughly $800 in carrying costs.
              Faster sale &gt; cheaper plan.
            </p>
          </div>
        </div>
      </section>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
        Charged in COP at ~4,100 / USD. Final rate may vary by ±2%.
      </p>
    </div>
  );
}
