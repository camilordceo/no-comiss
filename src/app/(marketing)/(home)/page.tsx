import Link from "next/link";
import {
  CheckCircle2,
  Zap,
  MessageSquare,
  TrendingUp,
  Star,
  Play,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InterestForm } from "@/components/marketing/interest-form";

const steps = [
  {
    n: "01",
    title: "Upload Photos & Tell Your Story",
    time: "5 minutes",
    description:
      "Upload photos from your phone. Tell us what makes your home special — your favorite room, the neighborhood, why you loved living there. Our AI creates a professional listing from your story.",
  },
  {
    n: "02",
    title: "AI Creates Your Marketing",
    time: "Automatic",
    description:
      "We generate a beautiful listing website, professional ad creatives, and a pricing analysis based on comparable sales in your area. You review and approve everything before it goes live.",
  },
  {
    n: "03",
    title: "Your Ads Go Live",
    time: "We handle this",
    description:
      "We run targeted ads on Facebook, Instagram, and Google reaching buyers in your area. Sellers who film short home tour videos get 3x more engagement — we'll help you create that content too.",
  },
  {
    n: "04",
    title: "AI Handles Buyer Communication",
    time: "24/7",
    description:
      "When buyers reach out, our AI responds instantly — answering questions, sharing photos, and scheduling showings. You get notified of every interaction and stay in complete control.",
  },
  {
    n: "05",
    title: "You Show Your Home & Review Offers",
    time: "You're in control",
    description:
      "You handle showings — you know your home best. When offers come in, our AI analyzes each one against market data and recommends whether to accept, counter, or wait.",
  },
  {
    n: "06",
    title: "Close with a Title Company",
    time: "We connect you",
    description:
      "We connect you with a licensed title company to handle the legal closing. You keep every dollar of the 5-6% that would have gone to an agent.",
  },
];

const youDo = [
  "Upload your photos and tell your home's story",
  "Set your asking price (with AI-powered guidance)",
  "Approve ad creatives before they go live",
  "Show your home to interested buyers",
  "Review and respond to offers",
  "Optionally: Film a short video tour for extra reach",
];

const aiDoes = [
  "Write professional listing descriptions",
  "Build your listing mini-website",
  "Generate and optimize ad creatives",
  "Run paid ads on Facebook, Instagram & Google",
  "Answer all buyer inquiries 24/7",
  "Schedule showings with your calendar",
  "Analyze offers with live market data",
  "Generate SEO content about your listing",
  "Track performance and optimize ad targeting",
];

const contentIdeas = [
  {
    Icon: Play,
    title: "Room-by-room tour",
    description: "60-second walkthrough from your phone. We edit it into polished ads.",
  },
  {
    Icon: Sparkles,
    title: "Why I love this neighborhood",
    description: "Talk about the schools, coffee shops, parks. Buyers want to feel it.",
  },
  {
    Icon: MessageSquare,
    title: "The story of our home",
    description: "The renovations, the memories, what made it special. Authenticity sells.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 99,
    desc: "Organic reach only",
    bestFor: "Homes under $300K",
    features: [
      "AI listing description",
      "Your own listing mini-site",
      "AI buyer agent via email",
      "Up to 50 photos",
      "Basic analytics dashboard",
      "Title company connection",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 499,
    desc: "Paid ads included (~$200/mo ad budget)",
    bestFor: "Most sellers",
    features: [
      "Everything in Starter",
      "Facebook & Instagram ads",
      "Google search ads",
      "AI buyer agent via email + SMS",
      "Offer analysis with market data",
      "Priority support",
    ],
    cta: "Start Free Week",
    highlighted: true,
  },
  {
    name: "Elite",
    price: 999,
    desc: "Full service (~$500/mo ad budget)",
    bestFor: "Premium & luxury homes",
    features: [
      "Everything in Pro",
      "MLS listing included",
      "Professional photo review",
      "Dedicated account manager",
      "Custom ad strategy",
      "Advanced analytics",
    ],
    cta: "Talk to Sales",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    city: "Austin, TX",
    text: "I was skeptical, but I saved $28,500 in commission and sold in 22 days. The AI handled every buyer question — I barely had to do anything between showings.",
    saved: "$28,500",
    rating: 5,
  },
  {
    name: "Marcus T.",
    city: "Phoenix, AZ",
    text: "I filmed a 90-second video walking through my house. NoComiss turned it into ads and I had 14 showing requests in the first week. Sold for $12K over asking.",
    saved: "$19,200",
    rating: 5,
  },
  {
    name: "Jennifer & Rob K.",
    city: "Raleigh, NC",
    text: "Our agent wanted $31,000 to sell our home. We used NoComiss Pro for 3 months — total cost $1,497. We kept the other $29,500. The process was honestly easier.",
    saved: "$31,000",
    rating: 5,
  },
];

export default function HomePage() {
  const exampleHome = 400_000;
  const agentFee = exampleHome * 0.06;
  const proThreeMonths = 499 * 3;
  const savings = agentFee - proThreeMonths;

  return (
    <div>

      {/* Hero */}
      <section className="gradient-hero pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                Fortune: Florida homeowner sold $100K over asking with AI
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-5">
                Sell Your Home
                <br />
                with AI. Keep
                <br />
                <span className="text-primary">the Commission.</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-lg">
                NoComiss is your AI real estate agent —{" "}
                <strong className="text-foreground">$499/month</strong> instead of{" "}
                <strong className="text-foreground">$24,000</strong>. We write your listing,
                run your ads, and answer buyers 24/7. You keep the 5-6%.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 mb-8">
                {["No agent required", "Cancel anytime", "First week free"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
              <div className="bg-white rounded-[12px] border border-border shadow-sm p-4 inline-block">
                <div className="grid grid-cols-3 divide-x divide-border text-center">
                  <div className="px-4 first:pl-0 last:pr-0">
                    <p className="text-2xl font-bold text-foreground">$22,500</p>
                    <p className="text-xs text-gray-400 mt-0.5">Avg. savings</p>
                  </div>
                  <div className="px-4">
                    <p className="text-2xl font-bold text-foreground">28 days</p>
                    <p className="text-xs text-gray-400 mt-0.5">Avg. to sell</p>
                  </div>
                  <div className="px-4">
                    <p className="text-2xl font-bold text-foreground">94%</p>
                    <p className="text-xs text-gray-400 mt-0.5">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest form */}
            <div className="bg-white rounded-[12px] border border-border shadow-sm p-6 lg:sticky lg:top-24">
              <InterestForm variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-foreground text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary text-sm font-medium uppercase tracking-wide mb-4">
            The story that started this
          </p>
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-relaxed mb-6">
            &ldquo;A homeowner in Florida used ChatGPT to write his listing, price his home,
            and negotiate the deal. He sold for $954,800 — $100,000 above what his agent estimated.
            He closed in 5 days.&rdquo;
          </blockquote>
          <p className="text-gray-400 text-sm mb-6">— Fortune Magazine, March 2026</p>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            That story went viral because everyone thought the same thing:{" "}
            <em>I could do that.</em> We built NoComiss to make that process accessible
            to every homeowner — not just the tech-savvy ones.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Six steps. You&apos;re in control the whole way.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step) => (
              <div key={step.n} className="bg-white rounded-[12px] border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-primary/10">{step.n}</span>
                  <span className="text-xs font-medium bg-surface text-gray-500 px-2.5 py-1 rounded-full border border-border">
                    {step.time}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* You vs AI */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">The split</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              What you do vs. what AI handles
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              You stay in control of the important decisions. AI handles everything that takes time.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white rounded-[12px] border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground">You handle</h3>
              </div>
              <ul className="space-y-2.5">
                {youDo.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-[12px] border-2 border-primary p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">NoComiss AI handles</h3>
              </div>
              <ul className="space-y-2.5">
                {aiDoes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Content Creation */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">Boost your sale</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Sellers who create content sell faster
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Sellers who post a short home tour video sell{" "}
                <strong className="text-foreground">2x faster</strong>. You don&apos;t need to be a creator.
                Film a 60-second walkthrough on your phone — we edit it into professional ads
                and distribute it across all platforms.
              </p>
              <ul className="space-y-3">
                {[
                  "Film on your phone — we handle editing and distribution",
                  "One video repurposed across Facebook, Instagram, and TikTok",
                  "Buyers who see video are 73% more likely to schedule a showing",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">3 ideas that work great:</p>
              {contentIdeas.map(({ Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4 p-4 bg-white rounded-[12px] border border-border shadow-sm">
                  <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Savings Comparison */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">The math</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">On a $400,000 home...</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[12px] border border-border p-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Traditional agent</p>
              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale price</span>
                  <span className="font-medium">$400,000</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Agent commission (6%)</span>
                  <span className="font-medium">−${agentFee.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold">
                  <span>You receive</span>
                  <span>${(exampleHome - agentFee).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                <div className="bg-red-300 h-full rounded-full" style={{ width: "94%" }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">${agentFee.toLocaleString()} leaves your pocket</p>
            </div>

            <div className="bg-white rounded-[12px] border-2 border-primary p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recommended
              </div>
              <p className="text-sm font-medium text-gray-500 mb-4">NoComiss Pro</p>
              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale price</span>
                  <span className="font-medium">$400,000</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>NoComiss Pro × 3 months</span>
                  <span className="font-medium">−${proThreeMonths.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold text-primary">
                  <span>You receive</span>
                  <span>${(exampleHome - proThreeMonths).toLocaleString()}</span>
                </div>
              </div>
              <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: "99.6%" }} />
              </div>
              <p className="text-xs text-primary font-medium mt-1.5">
                You save ${savings.toLocaleString()} vs. a traditional agent
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link href="/calculator">
                <TrendingUp className="w-4 h-4" />
                Calculate your exact savings
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">Real sellers</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              People are already doing this
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Saved</p>
                      <p className="text-base font-bold text-primary">{t.saved}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Flat monthly fee. No percentages.</h2>
            <p className="text-gray-500 mt-3">Cancel anytime. First week free on all plans.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[12px] border bg-white p-6 relative ${
                  plan.highlighted ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-semibold text-foreground mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <p className="text-xs text-gray-400">{plan.desc}</p>
                  <p className="text-xs font-medium text-primary mt-1">Best for: {plan.bestFor}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.highlighted ? "primary" : "outline"} size="md" className="w-full">
                  <Link href="/start">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">
            Most homes sell within 3 months — total cost on Pro is{" "}
            <strong className="text-foreground">$1,497</strong> vs.{" "}
            <strong className="text-foreground">$24,000</strong> with an agent on a $400K home.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Ready to keep your commission?
            </h2>
            <p className="text-gray-500">
              Tell us about your home and we&apos;ll send you a free value estimate — no commitment required.
            </p>
          </div>
          <div className="bg-white rounded-[12px] border border-border shadow-sm p-6">
            <InterestForm variant="cta" />
          </div>
        </div>
      </section>

    </div>
  );
}
