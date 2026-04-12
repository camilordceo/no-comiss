"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Globe, Pause, Play, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/types/database";

interface Props {
  listing: Listing;
  publicUrl: string;
}

export function ListingActions({ listing, publicUrl }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  async function setStatus(status: Listing["status"]) {
    setUpdating(true);
    setShowMenu(false);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "active" && !listing.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteListing() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setUpdating(true);
    const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/listings");
    else setUpdating(false);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Copy link */}
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      {/* Status actions */}
      <div className="relative">
        <button
          onClick={() => setShowMenu((s) => !s)}
          disabled={updating}
          className="flex items-center gap-1.5 text-sm bg-foreground text-white rounded-lg px-3 py-1.5 hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {updating ? "Updating..." : "Actions"}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg z-50 py-1 min-w-[160px]">
            {listing.status !== "active" && (
              <button
                onClick={() => setStatus("active")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
              >
                <Globe className="w-4 h-4 text-primary" /> Publish
              </button>
            )}
            {listing.status === "active" && (
              <button
                onClick={() => setStatus("paused")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
              >
                <Pause className="w-4 h-4 text-yellow-500" /> Pause listing
              </button>
            )}
            {listing.status === "paused" && (
              <button
                onClick={() => setStatus("active")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
              >
                <Play className="w-4 h-4 text-primary" /> Resume
              </button>
            )}
            {listing.status !== "sold" && (
              <button
                onClick={() => setStatus("sold")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
              >
                <Check className="w-4 h-4 text-green-600" /> Mark as sold
              </button>
            )}
            <div className="my-1 border-t border-border" />
            <button
              onClick={deleteListing}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete listing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
