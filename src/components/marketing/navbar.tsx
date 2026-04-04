"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/calculator", label: "Savings Calculator" },
  { href: "/blog", label: "Blog" },
];

export function MarketingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-xl text-foreground">
            <span className="text-primary">No</span>Comiss
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-gray-600 hover:text-foreground rounded-[8px] hover:bg-surface transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="md">
              <Link href="/start">Start Selling</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-[8px] hover:bg-surface transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-border overflow-hidden transition-all duration-200",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2.5 text-sm text-gray-600 hover:text-foreground rounded-[8px] hover:bg-surface transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 pb-1 flex flex-col gap-2">
            <Button asChild variant="outline" size="md" className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="md" className="w-full">
              <Link href="/start">Start Selling</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
