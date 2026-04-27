"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./nav-items";
import { UserCard } from "./user-card";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/lib/types/database";

interface HeaderProps {
  email: string;
  name: string;
  avatarUrl: string | null;
  notifications: Notification[];
  unreadCount: number;
}

function breadcrumbFromPath(path: string): string {
  if (path === "/dashboard") return "Overview";
  if (path.startsWith("/dashboard/property/new")) return "New listing";
  if (path.startsWith("/dashboard/property/")) return "Listing";
  if (path.startsWith("/dashboard/leads")) return "Leads";
  if (path.startsWith("/dashboard/showings")) return "Showings";
  if (path.startsWith("/dashboard/offers")) return "Offers";
  if (path.startsWith("/dashboard/settings")) return "Settings";
  return "Terminal";
}

export function Header({ email, name, avatarUrl, notifications, unreadCount }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const crumb = breadcrumbFromPath(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-rule bg-crema/95 px-5 backdrop-blur md:px-10",
      )}
    >
      {/* Mobile logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-serif text-lg font-medium tracking-tight text-text lg:hidden"
      >
        NoComiss
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
      </Link>

      {/* Desktop breadcrumb */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Terminal
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
          /
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-coral">
          {crumb}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Live indicator (desktop) */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="live-dot" aria-hidden />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
            AI Active
          </span>
        </div>

        {/* Notification bell */}
        <NotificationBell unreadCount={unreadCount} recent={notifications} />

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-sm border border-rule-strong bg-ivory text-text",
              "transition-all duration-180 hover:border-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso",
              "lg:hidden",
            )}
          >
            <Menu className="h-4 w-4" aria-hidden />
          </SheetTrigger>
          <SheetContent side="right" className="flex w-72 flex-col gap-0 p-0">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarNav variant="sheet" onNavigate={() => setOpen(false)} />
            </div>
            <UserCard email={email} name={name} avatarUrl={avatarUrl} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
