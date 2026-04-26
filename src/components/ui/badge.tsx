import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "bg-coral text-white",
        secondary: "bg-crema-2 text-text-2",
        outline: "bg-transparent text-text border border-rule-strong",
        ready: "bg-espresso text-text-on-dark",
        active: "bg-coral text-white",
        draft: "bg-crema-2 text-text-2",
        paused: "bg-rust text-white",
        sold: "bg-moss text-white",
        warning: "bg-coral-tint text-coral-deep border border-coral/30",
        info: "bg-crema-2 text-text-2 border border-rule-strong",
        destructive: "bg-rust/15 text-rust border border-rust/40",
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
