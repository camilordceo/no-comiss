import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-rule-strong bg-paper px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rule bg-ivory">
          <Icon className="h-5 w-5 text-coral" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-serif text-xl font-medium text-text">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-text-2">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
