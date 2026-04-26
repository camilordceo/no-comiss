import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[140px] w-full rounded-sm border border-rule-strong bg-ivory px-3.5 py-3",
          "text-[15px] text-text placeholder:text-text-3 leading-relaxed",
          "transition-colors duration-180",
          "hover:border-espresso/50",
          "focus-visible:outline-none focus-visible:border-espresso",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          "aria-[invalid=true]:border-rust",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
