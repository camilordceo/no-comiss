"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      theme="dark"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-border bg-surface-3 text-foreground shadow-md rounded-md font-sans",
          title: "text-sm font-semibold text-white",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-brand-green text-white",
          cancelButton: "bg-surface-4 text-foreground",
          success: "border-brand-green/50",
          error: "border-error/50",
        },
      }}
    />
  );
}
