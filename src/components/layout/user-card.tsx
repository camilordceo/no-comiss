"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UserCardProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  className?: string;
  showSettingsLink?: boolean;
}

export function UserCard({
  name,
  email,
  avatarUrl,
  className,
  showSettingsLink = true,
}: UserCardProps) {
  const initials =
    (name || email)
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border bg-surface-2 px-4 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-3 text-xs font-bold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {name || "Bienvenido"}
          </div>
          <div className="truncate text-xs text-muted-foreground">{email}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showSettingsLink ? (
          <Link
            href="/dashboard/settings"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-150 hover:bg-surface-3 hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden />
            Config
          </Link>
        ) : null}
        <form action="/api/auth/signout" method="post" className="flex-1">
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider text-error transition-all duration-150 hover:bg-error/15"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}
