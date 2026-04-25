import Link from "next/link";
import { ArrowRight, DollarSign, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-brand-light-gray">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-brand-black">
            No<span className="text-brand-teal">Comiss</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container flex flex-col items-center gap-8 py-20 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-light-gray bg-brand-bg-alt px-4 py-1.5 text-xs font-medium text-brand-muted">
          <Sparkles className="h-3.5 w-3.5 text-brand-teal" aria-hidden />
          AI-powered home selling for the US
        </div>

        <h1 className="max-w-3xl text-[clamp(1.875rem,6vw,3rem)] font-semibold leading-[1.1] tracking-tight text-brand-black">
          Sell your home. <span className="text-brand-teal">Keep the commission.</span>
        </h1>

        <p className="max-w-xl text-base text-brand-muted md:text-lg">
          Stop paying agents 5–6%. NoComiss generates your listing, runs ads, and handles buyer
          communication for a flat fee. Save $25,000+ on the average US sale.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">
              Start selling <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-brand-light-gray bg-brand-bg-alt py-20">
        <div className="container grid gap-8 md:grid-cols-3">
          {[
            {
              icon: DollarSign,
              title: "Flat $99–$999/mo",
              body: "No commission. No surprises. Pick a plan and keep the proceeds from your sale.",
            },
            {
              icon: Sparkles,
              title: "AI-generated listing",
              body: "Upload photos and a few details. Our AI writes the listing, headline, and ads.",
            },
            {
              icon: Zap,
              title: "Sells in days, not months",
              body: "Inspired by the Florida homeowner who used AI to sell for $100K above estimate in 5 days.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-lg border border-brand-light-gray bg-white p-6 shadow-sm card-hover stagger-item"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brand-mint/30">
                <Icon className="h-5 w-5 text-brand-teal" aria-hidden />
              </div>
              <h3 className="mb-1 text-lg font-medium text-brand-black">{title}</h3>
              <p className="text-sm text-brand-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-brand-light-gray py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-brand-muted md:flex-row">
          <p>© {new Date().getFullYear()} NoComiss by Rentmies</p>
          <p>Built for US homeowners.</p>
        </div>
      </footer>
    </main>
  );
}
