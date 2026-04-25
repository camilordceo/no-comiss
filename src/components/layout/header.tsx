"use client";

import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function Header({ email, name, avatarUrl }: HeaderProps) {
  const initials = (name || email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-light-gray bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="text-base font-medium text-brand-black md:hidden">
        No<span className="text-brand-teal">Comiss</span>
      </div>
      <div className="hidden md:block" />

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className={cn(
            "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-brand-light-gray bg-brand-bg-alt text-sm font-medium text-brand-black",
            "transition-all duration-200 hover:border-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
          )}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm font-medium text-brand-black">{name || "Welcome"}</div>
            <div className="truncate text-xs text-brand-muted">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action="/api/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-sm text-error"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
