import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-brand-light-gray bg-white p-5 shadow-sm card-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-brand-muted">{label}</div>
        {Icon ? <Icon className="h-4 w-4 text-brand-muted" aria-hidden /> : null}
      </div>
      <div className="mt-2 text-2xl font-medium text-brand-black">{value}</div>
      {trend ? <div className="mt-1 text-xs text-brand-muted">{trend}</div> : null}
    </div>
  );
}
