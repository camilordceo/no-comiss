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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/15">
        <AlertTriangle className="h-5 w-5 text-error" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-white">Algo salió mal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ocurrió un error inesperado. Inténtalo de nuevo o vuelve al inicio.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline">
        <RotateCw className="h-4 w-4" /> Reintentar
      </Button>
    </div>
  );
}
