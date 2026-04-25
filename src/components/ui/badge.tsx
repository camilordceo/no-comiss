import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-teal text-white",
        secondary: "bg-brand-medium-gray text-brand-black",
        outline: "border border-brand-light-gray text-brand-black",
        success: "bg-brand-mint/30 text-brand-black",
        warning: "bg-warning/15 text-warning",
        info: "bg-info/15 text-info",
        destructive: "bg-error/15 text-error",
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
