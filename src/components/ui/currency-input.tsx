"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  prefix?: string;
}

function parseDigits(input: string): number | null {
  const digits = input.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const num = Number(digits);
  return Number.isFinite(num) ? num : null;
}

function format(num: number | null | undefined): string {
  if (num == null || !Number.isFinite(num)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, prefix = "$", onBlur, ...props }, ref) => {
    const [display, setDisplay] = React.useState<string>(format(value));
    const [focused, setFocused] = React.useState(false);

    // Reflect parent value changes when not focused.
    React.useEffect(() => {
      if (!focused) setDisplay(format(value));
    }, [value, focused]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-muted">
          {prefix}
        </span>
        <input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={display}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onChange={(e) => {
            const raw = e.target.value;
            // Allow only digits and group commas while typing.
            const digits = raw.replace(/[^\d]/g, "");
            const num = digits ? Number(digits) : null;
            setDisplay(digits ? format(num) : "");
            onChange?.(num);
          }}
          onBlur={(e) => {
            setFocused(false);
            const num = parseDigits(e.target.value);
            setDisplay(format(num));
            onChange?.(num);
            onBlur?.(e);
          }}
          className={cn(
            "flex h-11 w-full rounded-md border border-brand-light-gray bg-white pl-7 pr-3 py-2 text-sm text-brand-black placeholder:text-brand-muted",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brand-medium-gray",
            className,
          )}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
