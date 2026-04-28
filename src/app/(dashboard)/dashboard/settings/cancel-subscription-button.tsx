"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (submitting) return;
    const ok = window.confirm(
      "Cancel your plan? You keep access until the end of the current billing period.",
    );
    if (!ok) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (!res.ok) {
        toast.error("Couldn't cancel. Try again.");
        return;
      }
      toast.success("Subscription cancelled.");
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button variant="destructive" onClick={handleClick} disabled={submitting}>
      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Cancel plan
    </Button>
  );
}
