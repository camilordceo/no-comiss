"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("route.dashboard_error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rust/15">
        <AlertTriangle className="h-5 w-5 text-rust" aria-hidden />
      </div>
      <div>
        <div className="eyebrow eyebrow-coral mb-2">Error</div>
        <h1 className="font-serif text-2xl font-medium text-text">
          <span className="italic">Something broke.</span>
        </h1>
        <p className="mt-2 text-sm text-text-2">
          The terminal hit an unexpected error. Try again or head back to overview.
        </p>
      </div>
      <Button onClick={() => reset()} variant="ghost">
        <RotateCw className="h-3.5 w-3.5" /> Try again
      </Button>
    </div>
  );
}
