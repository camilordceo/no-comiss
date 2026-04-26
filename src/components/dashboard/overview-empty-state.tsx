import Link from "next/link";
import { ArrowRight, Camera, MessageSquare, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverviewEmptyState() {
  return (
    <div className="space-y-10">
      <header className="rounded-sm border border-rule bg-ivory p-8 md:p-12">
        <div className="flex flex-col items-start gap-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <div className="eyebrow eyebrow-coral">Welcome to your terminal</div>
            <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.01em] text-text">
              <span className="italic">Your home isn&apos;t listed yet.</span>
            </h1>
            <p className="text-base text-text-2 md:text-lg">
              Upload your photos, set your price. AI writes the listing, runs the
              ads, screens the leads. You keep the commission.
            </p>
          </div>
          <Button asChild variant="spark" size="lg">
            <Link href="/dashboard/property/new">
              List my home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <div>
        <div className="eyebrow mb-4">How it works</div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: Upload,
              title: "Upload your home",
              body: "Address, photos, asking price. Five minutes max.",
            },
            {
              step: "02",
              icon: Sparkles,
              title: "AI takes the listing live",
              body: "Copy, ads, screening — automated and on around the clock.",
            },
            {
              step: "03",
              icon: MessageSquare,
              title: "Real offers in your inbox",
              body: "Skip the agent chat. We hand you serious buyers.",
            },
          ].map(({ step, icon: Icon, title, body }) => (
            <article
              key={step}
              className="hover-lift border border-rule bg-ivory p-7"
            >
              <div className="flex items-center justify-between">
                <div className="data-key">Step {step}</div>
                <Icon className="h-4 w-4 text-text-3" aria-hidden />
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium leading-tight text-text">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
