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
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-brand-light-gray bg-brand-bg-alt px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-brand-light-gray">
          <Icon className="h-6 w-6 text-brand-teal" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-lg font-medium text-brand-black">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-brand-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
