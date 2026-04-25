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

export function UserCard({ name, email, avatarUrl, className, showSettingsLink = true }: UserCardProps) {
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
        "flex flex-col gap-3 border-t border-brand-light-gray bg-white px-4 py-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-light-gray bg-brand-bg-alt text-xs font-medium text-brand-black">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-brand-black">
            {name || "Welcome"}
          </div>
          <div className="truncate text-xs text-brand-muted">{email}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showSettingsLink ? (
          <Link
            href="/dashboard/settings"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-brand-muted transition-all duration-200 hover:bg-brand-medium-gray hover:text-brand-black"
          >
            <Settings className="h-3.5 w-3.5" aria-hidden />
            Settings
          </Link>
        ) : null}
        <form action="/api/auth/signout" method="post" className="flex-1">
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md text-xs font-medium text-error transition-all duration-200 hover:bg-error/10"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
