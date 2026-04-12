"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Check, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface AIDescription {
  type: "emotional" | "professional" | "social";
  title: string;
  body: string;
  seoDescription?: string;
  socialCaption?: string;
}

interface GenerateClientProps {
  listing: Listing;
}

const TYPE_LABELS: Record<AIDescription["type"], { label: string; desc: string; emoji: string }> = {
  emotional:    { label: "Emotional",    desc: "Story-driven — paint a picture of living there",    emoji: "✦" },
  professional: { label: "Professional", desc: "MLS-style, factual and data-driven",                 emoji: "◆" },
  social:       { label: "Social",       desc: "Casual, shareable — perfect for TikTok and Instagram", emoji: "●" },
};

function SkeletonDescription() {
  return (
    <div className="rounded-[12px] border border-border p-5 space-y-3 animate-pulse">
      <div className="h-5 bg-[#e5e5e5] rounded w-1/3" />
      <div className="h-3.5 bg-[#e5e5e5] rounded w-2/3" />
      <div className="space-y-2 mt-3">
        <div className="h-3 bg-[#e5e5e5] rounded" />
        <div className="h-3 bg-[#e5e5e5] rounded w-11/12" />
        <div className="h-3 bg-[#e5e5e5] rounded w-10/12" />
        <div className="h-3 bg-[#e5e5e5] rounded w-4/5" />
      </div>
    </div>
  );
}

export function GenerateClient({ listing }: GenerateClientProps) {
  const router = useRouter();
  const [descriptions, setDescriptions] = useState<AIDescription[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [editedBody, setEditedBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we already have AI descriptions
  const existing = listing.ai_descriptions as AIDescription[] | null;
  const alreadyHas = Array.isArray(existing) && existing.length >= 3;

  useEffect(() => {
    if (alreadyHas) {
      setDescriptions(existing!);
      setSelected(listing.selected_description_idx ?? 0);
    } else {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    setDescriptions([]);

    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          property_type: listing.property_type,
          address: listing.address,
          city: listing.city,
          state: (listing as Record<string, unknown>).state,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqft: (listing as Record<string, unknown>).sqft ?? listing.area_m2,
          year_built: (listing as Record<string, unknown>).year_built,
          garage_spaces: (listing as Record<string, unknown>).garage_spaces,
          hoa_monthly: (listing as Record<string, unknown>).hoa_monthly,
          price: listing.price,
          amenities: listing.amenities,
          story: (listing as Record<string, unknown>).seller_story ?? listing.description,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const json = await res.json();
      const descs: AIDescription[] = json.descriptions ?? json;
      setDescriptions(descs);
      setSelected(0);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (selected === null) return;
    setSaving(true);
    setError(null);

    try {
      const finalBody = editing === selected ? editedBody : descriptions[selected]?.body;
      const updated = descriptions.map((d, i) =>
        i === selected ? { ...d, body: finalBody } : d
      );

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_descriptions: updated,
          selected_description_idx: selected,
          description: finalBody,
          status: "active",
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      router.push(`/homes/${listing.slug}`);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      {generating && (
        <div className="flex items-center gap-3 rounded-[12px] bg-primary/5 border border-primary/20 px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Writing your listing...</p>
            <p className="text-xs text-gray-500 mt-0.5">Claude is crafting 3 versions — emotional, professional, and social.</p>
          </div>
        </div>
      )}

      {/* Skeletons while generating */}
      {generating && (
        <div className="space-y-4">
          <SkeletonDescription />
          <SkeletonDescription />
          <SkeletonDescription />
        </div>
      )}

      {/* Description cards */}
      {!generating && descriptions.length > 0 && (
        <div className="space-y-4">
          {descriptions.map((desc, i) => {
            const meta = TYPE_LABELS[desc.type] ?? { label: desc.type, desc: "", emoji: "●" };
            const isSelected = selected === i;
            const isEditing = editing === i;

            return (
              <div
                key={i}
                onClick={() => { if (!isEditing) setSelected(i); }}
                className={cn(
                  "rounded-[12px] border-2 p-5 cursor-pointer transition-all duration-200 hover:translateY(-2px)",
                  isSelected
                    ? "border-primary bg-primary/3 shadow-sm"
                    : "border-border bg-white hover:border-gray-300"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-primary text-xs font-bold">{meta.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                      <p className="text-xs text-gray-500">{meta.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <p className="text-sm font-semibold text-foreground mb-2">{desc.title}</p>

                {/* Body */}
                {isEditing ? (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    rows={6}
                    className="w-full px-3 py-2.5 rounded-[8px] border border-primary bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{desc.body}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditing) {
                        setEditing(null);
                      } else {
                        setEditedBody(desc.body);
                        setEditing(i);
                        setSelected(i);
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-foreground transition-colors"
                  >
                    {isEditing ? "Done editing" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); generate(); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate all
                  </button>
                  {desc.socialCaption && (
                    <span className="ml-auto text-xs text-gray-400 truncate max-w-[180px]" title={desc.socialCaption}>
                      Caption: &ldquo;{desc.socialCaption.slice(0, 40)}...&rdquo;
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regenerate button */}
      {!generating && descriptions.length > 0 && (
        <button
          type="button"
          onClick={generate}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate completely new versions
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">{error}</p>
      )}

      {/* CTA */}
      {!generating && descriptions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            size="md"
            onClick={handleConfirm}
            disabled={selected === null || saving}
            loading={saving}
            className="flex-1"
          >
            {saving ? "Publishing..." : "Use this description & publish"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              const url = `/homes/${listing.slug}`;
              window.open(url, "_blank");
            }}
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview listing site
          </Button>
        </div>
      )}
    </div>
  );
}
