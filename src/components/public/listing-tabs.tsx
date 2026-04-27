"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  description: string | null;
  sellerStory: string | null;
  city: string | null;
  state: string | null;
}

const TABS = ["about", "story", "neighborhood"] as const;
type Tab = (typeof TABS)[number];

const LABEL: Record<Tab, string> = {
  about: "About",
  story: "Seller's story",
  neighborhood: "Neighborhood",
};

export function ListingTabs({ description, sellerStory, city, state }: Props) {
  const [tab, setTab] = useState<Tab>(description ? "about" : sellerStory ? "story" : "about");

  return (
    <div>
      <div role="tablist" className="flex items-center gap-1 border-b border-rule-strong">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
              tab === t ? "text-text" : "text-text-3 hover:text-text",
              "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px]",
              tab === t ? "after:bg-coral" : "after:bg-transparent",
            )}
          >
            {LABEL[t]}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {tab === "about" ? (
          <Prose text={description} fallback="The homeowner is finishing the description. Reach out below — they'll fill you in." />
        ) : null}
        {tab === "story" ? (
          <Prose text={sellerStory} fallback="The homeowner hasn't shared their story yet." />
        ) : null}
        {tab === "neighborhood" ? (
          <p className="font-serif text-lg leading-relaxed text-text-2">
            {city || state
              ? `Tucked into ${[city, state].filter(Boolean).join(", ")}. Neighborhood notes from the homeowner are coming soon.`
              : "Neighborhood notes coming soon."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Prose({ text, fallback }: { text: string | null; fallback: string }) {
  if (!text || !text.trim()) {
    return <p className="font-serif text-lg italic leading-relaxed text-text-3">{fallback}</p>;
  }
  return (
    <div className="space-y-4 font-serif text-lg leading-relaxed text-text-2">
      {text
        .split(/\n{2,}/)
        .map((para) => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i}>{para}</p>
        ))}
    </div>
  );
}
