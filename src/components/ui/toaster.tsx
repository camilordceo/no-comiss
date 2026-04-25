"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-brand-light-gray bg-white text-brand-black shadow-sm rounded-md font-sans",
          title: "text-sm font-medium text-brand-black",
          description: "text-sm text-brand-muted",
          actionButton: "bg-brand-teal text-white",
          cancelButton: "bg-brand-medium-gray text-brand-black",
        },
      }}
    />
  );
}
