import Link from "next/link";
import { Home, ArrowRight, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OverviewEmptyState() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-brand-light-gray bg-white p-8 shadow-sm md:p-12">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-mint/30 px-3 py-1 text-xs font-medium text-brand-black">
              <Sparkles className="h-3.5 w-3.5 text-brand-teal" aria-hidden />
              Welcome to NoComiss
            </div>
            <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-medium leading-tight tracking-tight text-brand-black">
              Let&apos;s get your home listed.
            </h1>
            <p className="text-base text-brand-muted">
              Upload photos, share the story, and we&apos;ll do the rest. Most homeowners save
              $25,000+ in commission.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/dashboard/property/new">
              Start onboarding <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Home,
            title: "Tell us about your home",
            body: "Address, square footage, bedrooms, the basics.",
          },
          {
            icon: Sparkles,
            title: "Upload photos & video",
            body: "Drag and drop. We organize and optimize them.",
          },
          {
            icon: DollarSign,
            title: "Set your price",
            body: "We help you price right so it sells fast.",
          },
        ].map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            className="rounded-lg border border-brand-light-gray bg-white p-6 shadow-sm card-hover stagger-item"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-mint/30">
              <Icon className="h-5 w-5 text-brand-teal" aria-hidden />
            </div>
            <div className="mb-1 text-xs font-medium text-brand-muted">Step {i + 1}</div>
            <h3 className="mb-1 text-base font-medium text-brand-black">{title}</h3>
            <p className="text-sm text-brand-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
