import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
              {prefix}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "h-11 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground placeholder:text-gray-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary focus:bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-400 focus:ring-red-400",
              prefix && "pl-9",
              suffix && "pr-9",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
