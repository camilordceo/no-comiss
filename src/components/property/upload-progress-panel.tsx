"use client";

import { AlertCircle, CheckCircle2, Loader2, RotateCw, X } from "lucide-react";

import type { UploadTicket } from "@/lib/hooks/use-upload";
import { cn } from "@/lib/utils/cn";

interface UploadProgressPanelProps {
  uploads: UploadTicket[];
  onDismiss: (id: string) => void;
  onRetry: (id: string) => void;
}

export function UploadProgressPanel({ uploads, onDismiss, onRetry }: UploadProgressPanelProps) {
  if (uploads.length === 0) return null;

  const inFlight = uploads.filter((u) => u.status === "uploading" || u.status === "pending").length;
  const errors = uploads.filter((u) => u.status === "error").length;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg border border-brand-light-gray bg-white shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-brand-light-gray bg-brand-bg-alt px-4 py-2.5">
        <div className="text-sm font-medium text-brand-black">
          {inFlight > 0 ? `Uploading ${inFlight}…` : errors > 0 ? "Some uploads failed" : "Uploads"}
        </div>
        <div className="text-xs text-brand-muted">{uploads.length} total</div>
      </div>
      <ul className="max-h-72 overflow-y-auto">
        {uploads.map((u) => (
          <li
            key={u.id}
            className="flex items-center gap-3 border-b border-brand-light-gray px-4 py-3 last:border-b-0"
          >
            <StatusIcon status={u.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-brand-black">{u.name}</div>
              {u.status === "uploading" || u.status === "pending" ? (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-brand-medium-gray">
                  <div
                    className="h-full progress-fill"
                    style={{ width: `${Math.max(5, u.progress)}%` }}
                  />
                </div>
              ) : null}
              {u.status === "error" ? (
                <div className="mt-0.5 text-xs text-error">{u.error ?? "Upload failed"}</div>
              ) : null}
            </div>
            {u.status === "error" ? (
              <button
                type="button"
                onClick={() => onRetry(u.id)}
                aria-label="Retry"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-muted hover:bg-brand-medium-gray hover:text-brand-black"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(u.id)}
              aria-label="Dismiss"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-muted hover:bg-brand-medium-gray hover:text-brand-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: UploadTicket["status"] }) {
  if (status === "success") {
    return <CheckCircle2 className={cn("h-4 w-4 flex-none text-brand-teal")} aria-hidden />;
  }
  if (status === "error") {
    return <AlertCircle className="h-4 w-4 flex-none text-error" aria-hidden />;
  }
  return <Loader2 className="h-4 w-4 flex-none animate-spin text-brand-teal" aria-hidden />;
}
