"use client";

import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FirstVideoCelebration({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-coral-tint text-coral-deep">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>First video uploaded.</DialogTitle>
          <DialogDescription>
            Buyers feel a home before they see it. Yours just got more real.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-text-2">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            73% more buyer engagement
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            Priority placement in ads
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-coral" aria-hidden />
            Richer listing page
          </li>
        </ul>

        <div className="rounded-sm border border-rule bg-crema-2 p-3 text-xs leading-relaxed text-text-2">
          <span className="font-mono font-semibold uppercase tracking-[0.14em] text-text">
            Pro tip ·
          </span>{" "}
          Film a 60-second walkthrough next. Front door → each room → your
          favorite spot. That&apos;s the one buyers rewatch.
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
