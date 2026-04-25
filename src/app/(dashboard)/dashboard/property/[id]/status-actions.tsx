"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pause, Play, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { logger } from "@/lib/utils/logger";
import type { ListingStatus } from "@/lib/types/database";

interface StatusActionsProps {
  propertyId: string;
  status: ListingStatus;
}

export function StatusActions({ propertyId, status }: StatusActionsProps) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function setStatus(next: ListingStatus, label: string) {
    setWorking(true);
    try {
      const res = await fetch(`/api/property/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_status: next }),
      });
      if (!res.ok) {
        toast.error("Couldn't update status.");
        return;
      }
      logger.info("property.status_changed", { propertyId, next });
      toast.success(label);
      router.refresh();
    } catch (err) {
      logger.error("property.status_exception", { error: err });
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    setWorking(true);
    try {
      const res = await fetch(`/api/property/${propertyId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete listing.");
        return;
      }
      logger.info("property.deleted_from_ui", { propertyId });
      toast.success("Listing deleted");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      logger.error("property.delete_exception", { error: err });
    } finally {
      setWorking(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "ready" || status === "paused" ? (
        <Button onClick={() => setStatus("active", "Listing is live")} disabled={working}>
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Publish
        </Button>
      ) : null}

      {status === "active" ? (
        <Button
          variant="outline"
          onClick={() => setStatus("paused", "Listing paused")}
          disabled={working}
        >
          <Pause className="h-4 w-4" /> Pause
        </Button>
      ) : null}

      {status === "paused" ? (
        <Button
          variant="outline"
          onClick={() => setStatus("active", "Listing resumed")}
          disabled={working}
        >
          <Play className="h-4 w-4" /> Resume
        </Button>
      ) : null}

      <Button
        variant="ghost"
        onClick={() => setConfirmDelete(true)}
        disabled={working}
        className="text-error hover:bg-error/10 hover:text-error"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              This permanently removes the listing and all media metadata. Files in storage are
              also removed. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={working}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={working}>
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
