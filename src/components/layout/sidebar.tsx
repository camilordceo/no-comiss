"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/property",
    label: "My Property",
    icon: Home,
    match: (p) => p.startsWith("/dashboard/property") && !p.includes("/photos"),
  },
  {
    href: "/dashboard/photos",
    label: "Photos",
    icon: ImageIcon,
    match: (p) => p.includes("/photos"),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

interface SidebarProps {
  propertyHref?: string | null;
  photosHref?: string | null;
}

export function Sidebar({ propertyHref, photosHref }: SidebarProps) {
  const pathname = usePathname();

  function resolveHref(item: NavItem): string {
    if (item.label === "My Property") return propertyHref ?? "/dashboard/property/new";
    if (item.label === "Photos") return photosHref ?? "/dashboard/property/new";
    return item.href;
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-brand-light-gray bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-brand-light-gray px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-brand-black">
          No<span className="text-brand-teal">Comiss</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          const href = resolveHref(item);
          const disabled =
            (item.label === "My Property" && !propertyHref) ||
            (item.label === "Photos" && !photosHref);
          return (
            <Link
              key={item.label}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-disabled={disabled}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-mint/30 text-brand-black"
                  : "text-brand-muted hover:bg-brand-medium-gray hover:text-brand-black",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-brand-teal")} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-brand-light-gray p-4 text-xs text-brand-muted">
        Built for US homeowners.
      </div>
    </aside>
  );
}
