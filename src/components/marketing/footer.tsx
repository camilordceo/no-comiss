import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function MarketingFooter() {
  return (
    <footer className="bg-foreground text-white mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <p className="font-bold text-xl mb-3">
              <span className="text-primary">No</span>Comiss
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your AI real estate agent. Sell your home without paying 5-6% commission.
            </p>
            <p className="text-xs text-gray-500 mt-3">by Rentmies Inc. &middot; Austin, TX</p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Product</p>
            <ul className="space-y-2">
              {[
                { href: "/#how-it-works", label: "How It Works" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/calculator", label: "Savings Calculator" },
                { href: "/start", label: "Start Selling" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Resources</p>
            <ul className="space-y-2">
              {[
                { href: "/blog", label: "Blog" },
                { href: "/blog/sell-home-without-agent", label: "FSBO Guide" },
                { href: "/blog/real-cost-of-real-estate-agent", label: "Agent Cost Calculator" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Company</p>
            <ul className="space-y-2">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "mailto:hello@nocomiss.com", label: "Contact Us" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Rentmies Inc. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Austin, TX &middot; Not a licensed real estate broker
          </p>
        </div>
      </div>
    </footer>
  );
}
