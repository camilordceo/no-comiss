"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="light"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-rule-strong bg-ivory text-text rounded-sm font-sans !shadow-none",
          title: "text-sm font-semibold text-text",
          description: "text-sm text-text-3",
          actionButton: "bg-espresso text-text-on-dark",
          cancelButton: "bg-crema-2 text-text",
          success: "border-moss/40",
          error: "border-rust/40",
          warning: "border-coral/40",
        },
      }}
    />
  );
}
