import Link from "next/link";
import { ArrowRight, Camera, MessageSquare, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animations/reveal";

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-crema text-text">
      {/* ───────────────── NAV ───────────────── */}
      <header className="border-b border-rule">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-medium tracking-tight text-text">
            NoComiss
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="link" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href="/signup">List my home</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-rule-strong px-3 py-1.5">
                <span className="live-dot" aria-hidden />
                AI-Powered Home Selling · United States
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h1 className="mt-8 font-serif text-[clamp(2.5rem,7vw,5rem)] font-medium leading-[1.02] tracking-[-0.02em] text-text">
                Sell your home.
                <br />
                <span className="italic text-coral">Keep the commission.</span>
              </h1>
            </Reveal>

            <Reveal delay={240}>
              <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-text-2 md:text-xl">
                The 6% real estate commission was invented in 1913. It costs the
                average American seller{" "}
                <span className="font-semibold text-text">$25,000 to $50,000</span>{" "}
                — to put a house on a website. We replaced that with AI.
              </p>
            </Reveal>

            <Reveal delay={360}>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild variant="spark" size="lg">
                  <Link href="/signup">
                    List my home — $99/mo
                  </Link>
                </Button>
                <Button asChild variant="link" size="lg">
                  <Link href="/login" className="!normal-case !tracking-normal !text-text-2">
                    I already have an account →
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={480}>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-text-3">
                No agent · No commission · Cancel anytime
              </p>
            </Reveal>
          </div>
        </div>

        {/* Subtle decorative rule */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-rule" aria-hidden />
      </section>

      {/* ───────────────── THE MATH ───────────────── */}
      <section className="border-b border-rule bg-paper">
        <div className="container py-20 md:py-28">
          <div className="grid items-end gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div>
                <div className="eyebrow eyebrow-coral mb-5">The Math</div>
                <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.01em] text-text">
                  <span className="italic">$42,500.</span>
                  <br />
                  That&apos;s what your agent will charge.
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-text-2">
                  On a $700,000 home — the U.S. median — the standard 6% commission
                  takes <strong className="text-text">$42,000</strong> off the table at
                  closing. The average agent spends{" "}
                  <strong className="text-text">12 hours</strong> on your sale. Do the
                  math on the hourly rate.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-3">
              <Reveal delay={80}>
                <div className="stat-tile">
                  <div className="data-key">Traditional Commission</div>
                  <div className="stat-value mt-2">6%</div>
                  <div className="mt-2 text-sm text-text-3">
                    Standard agent split — buyer + seller side
                  </div>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div className="stat-tile">
                  <div className="data-key">NoComiss Price</div>
                  <div className="stat-value mt-2">$99<span className="text-2xl text-text-3">/mo</span></div>
                  <div className="mt-2 text-sm text-text-3">
                    Flat rate. Cancel when you close.
                  </div>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <div className="stat-tile stat-tile-spark">
                  <div className="data-key" style={{ color: "var(--coral)" }}>Your Savings</div>
                  <div className="stat-value mt-2">$42,401</div>
                  <div className="mt-2 text-sm text-text-3">
                    On the median U.S. home sale
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── HOW IT WORKS ───────────────── */}
      <section className="border-b border-rule">
        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <div className="eyebrow mb-5">How NoComiss Works</div>
              <h2 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.01em]">
                Three steps. <span className="italic">No agents.</span>
              </h2>
              <p className="mt-5 text-base text-text-2 md:text-lg">
                Real estate is one of the last industries paying humans for
                spreadsheet work. We fixed that.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-3 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload",
                body: "Drop your photos, address, and asking price. Five minutes, max. No paperwork, no signatures, no agent meeting.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "AI takes over",
                body: "We write the listing copy, design the ads, target the buyers, screen the leads, and answer questions 24/7 in your name.",
              },
              {
                step: "03",
                icon: MessageSquare,
                title: "You close",
                body: "Real buyers, real offers, in your inbox. You handle showings (or don't). We handle the paperwork. You keep the money.",
              },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <Reveal key={step} delay={i * 100}>
                <article className="hover-lift h-full border border-rule bg-ivory p-7">
                  <div className="flex items-center justify-between">
                    <div className="data-key">Step {step}</div>
                    <Icon className="h-4 w-4 text-text-3" aria-hidden />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-medium leading-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-2">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── PROOF ───────────────── */}
      <section className="border-b border-rule bg-paper">
        <div className="container py-20 md:py-28">
          <Reveal>
            <div className="eyebrow eyebrow-coral mb-5 text-center">Real homes. Real savings.</div>
            <h2 className="text-center font-serif text-[clamp(1.75rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.01em]">
              The receipts.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {[
              {
                location: "FL · 3BR ranch",
                saved: "$61,200",
                days: "5 days",
                quote: "Sold in 5 days. Buyer paid asking. The whole thing felt illegal.",
              },
              {
                location: "TX · Townhouse",
                saved: "$38,500",
                days: "9 days",
                quote: "Three offers in the first week. I kept the difference.",
              },
              {
                location: "CA · 4BR home",
                saved: "$94,000",
                days: "12 days",
                quote: "Saved a year of college tuition by skipping the agent.",
              },
            ].map((r, i) => (
              <Reveal key={r.location} delay={i * 100}>
                <article className="h-full border border-rule bg-ivory p-7">
                  <div className="flex items-baseline justify-between">
                    <div className="data-key">Saved</div>
                    <div className="data-key">{r.days}</div>
                  </div>
                  <div className="stat-value mt-2 text-coral">{r.saved}</div>
                  <p className="mt-5 font-serif text-base italic leading-snug text-text-2">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                  <div className="mt-5 border-t border-rule pt-3 data-key">{r.location}</div>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300}>
            <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">
              Composite of beta sellers · Individual results vary
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── AI INSIGHT BLOCK (espresso) ───────────────── */}
      <section className="border-b border-rule">
        <div className="container py-20">
          <Reveal>
            <article className="border border-espresso bg-espresso p-10 md:p-16">
              <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-14">
                <div>
                  <div className="eyebrow text-coral">✦ The Pivot</div>
                </div>
                <div>
                  <p className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium italic leading-[1.15] text-text-on-dark">
                    The 6% commission was invented in 1913.
                    <br />
                    Your AI agent works 24/7 for $99 a month.
                  </p>
                  <p className="mt-7 max-w-2xl text-base leading-relaxed text-text-on-dark-2">
                    Wall Street has trading bots. Doctors have ChatGPT. The Department
                    of Defense has Copilot. You shouldn&apos;t need to pay $40,000 to
                    list a house on a website. We rebuilt the agent — pricing intel,
                    listing copy, ad targeting, lead screening — for the price of a
                    decent dinner.
                  </p>
                  <div className="mt-8">
                    <Button asChild variant="onDark" size="default">
                      <Link href="/signup">
                        Take the agent&apos;s job <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── FINAL CTA ───────────────── */}
      <section>
        <div className="container py-24 md:py-32 text-center">
          <Reveal>
            <div className="eyebrow mb-5">Ready when you are</div>
            <h2 className="mx-auto max-w-3xl font-serif text-[clamp(2.25rem,6vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]">
              Stop paying for a license.{" "}
              <span className="italic text-coral">Start selling.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-text-2 md:text-lg">
              Five minutes to set up. First leads in 48 hours. Your money in your
              pocket — not theirs.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild variant="spark" size="lg">
                <Link href="/signup">
                  List my home — $99/mo
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-text-3">
              Cancel anytime · No agent contract · Keep your equity
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className="border-t border-rule bg-paper">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-text-3 md:flex-row">
          <p className="flex items-center gap-2">
            <span className="font-serif text-base text-text">NoComiss</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
            <span className="data-key">© {new Date().getFullYear()}</span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
            Built for U.S. homeowners · Not a real estate agent · Not legal advice
          </p>
        </div>
      </footer>
    </main>
  );
}
