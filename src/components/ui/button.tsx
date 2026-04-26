import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm",
    "font-mono uppercase font-semibold tracking-[0.16em]",
    "transition-all duration-180 ease-cap",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 focus-visible:ring-offset-crema",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — espresso (use for most actions)
        default:
          "bg-espresso text-text-on-dark hover:bg-espresso-2 hover:text-paper",
        // Spark — coral (one per page, the single most important action)
        spark:
          "bg-coral text-white hover:bg-coral-deep",
        // Ghost — bordered, on crema background
        ghost:
          "bg-transparent text-text border border-rule-strong hover:border-espresso hover:bg-ivory/60",
        // On dark — for dark espresso surfaces
        onDark:
          "bg-ivory text-espresso hover:bg-paper",
        // Outline — alias of ghost (kept for compat)
        outline:
          "bg-transparent text-text border border-rule-strong hover:border-espresso hover:bg-ivory/60",
        // Secondary — subtle ivory pill
        secondary:
          "bg-ivory text-text border border-rule-strong hover:border-espresso",
        // Link — text-only, coral on hover
        link:
          "px-0 h-auto bg-transparent text-text hover:text-coral underline underline-offset-4 decoration-rule-strong hover:decoration-coral",
        // Destructive — rust outline
        destructive:
          "bg-transparent text-rust border border-rust/40 hover:bg-rust/10 hover:border-rust",
      },
      size: {
        default: "text-[11px] px-5 py-3 h-10",
        sm: "text-[10px] px-3 py-2 h-8",
        lg: "text-[12px] px-6 py-3.5 h-12",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
