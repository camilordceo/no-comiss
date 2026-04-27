"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";
import type { ListingStatus } from "@/lib/types/database";

interface Props {
  propertyId: string;
  status: ListingStatus;
  hasPhotos: boolean;
}

const PUBLIC = ["active", "under_offer", "sold"] as const;

export function PublishToggle({ propertyId, status, hasPhotos }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const isPublic = (PUBLIC as readonly string[]).includes(status);

  const flipTo = async (next: ListingStatus) => {
    if (next === "active" && !hasPhotos) {
      toast.error("Add at least one photo before publishing.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/property/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_status: next }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || body?.error || "Couldn't update");
      logger.info("property.status_changed", { propertyId, status: next });
      toast.success(
        next === "active"
          ? "Live. Your public page is now shareable."
          : next === "paused"
            ? "Paused. The public page is hidden."
            : "Saved.",
      );
      startTransition(() => router.refresh());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (isPublic) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy || pending}
        onClick={() => flipTo("paused")}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
        Unpublish
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="spark"
      size="sm"
      disabled={busy || pending}
      onClick={() => flipTo("active")}
      title={!hasPhotos ? "Add at least one photo first" : undefined}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
      Publish listing
    </Button>
  );
}
