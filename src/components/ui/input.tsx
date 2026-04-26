import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-sm border border-rule-strong bg-ivory px-3.5 py-2.5",
          "text-[15px] text-text placeholder:text-text-3",
          "transition-colors duration-180",
          "hover:border-espresso/50",
          "focus-visible:outline-none focus-visible:border-espresso",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-crema-2",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text",
          "aria-[invalid=true]:border-rust",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
