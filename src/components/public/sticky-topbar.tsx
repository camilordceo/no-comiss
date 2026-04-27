"use client";

import Link from "next/link";

interface Props {
  ctaHref?: string;
  ctaLabel?: string;
}

export function StickyTopbar({ ctaHref = "#contact", ctaLabel = "Schedule a showing" }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule-strong bg-crema/95 backdrop-blur supports-[backdrop-filter]:bg-crema/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-serif text-base font-medium tracking-tight text-text"
        >
          NoComiss
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
        </Link>
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-sm bg-coral px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-coral-deep"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
