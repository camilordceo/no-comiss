import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-green/15 text-brand-green border-brand-green/30",
        secondary: "bg-surface-3 text-foreground border-border",
        outline: "bg-transparent text-foreground border-border",
        success: "bg-brand-green/15 text-brand-green border-brand-green/30",
        warning: "bg-warning/15 text-warning border-warning/30",
        info: "bg-info/15 text-info border-info/30",
        destructive: "bg-error/15 text-error border-error/30",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
