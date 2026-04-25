"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface NavConfig {
  propertyHref: string | null;
  photosHref: string | null;
}

interface NavItem {
  key: "overview" | "property" | "photos" | "settings";
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
  disabled: boolean;
}

function buildNav({ propertyHref, photosHref }: NavConfig): NavItem[] {
  return [
    {
      key: "overview",
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      match: (p) => p === "/dashboard",
      disabled: false,
    },
    {
      key: "property",
      href: propertyHref ?? "/dashboard/property/new",
      label: "My Listing",
      icon: Home,
      match: (p) => p.startsWith("/dashboard/property") && !p.includes("/photos"),
      disabled: !propertyHref,
    },
    {
      key: "photos",
      href: photosHref ?? "/dashboard/property/new",
      label: "Photos",
      icon: ImageIcon,
      match: (p) => p.includes("/photos"),
      disabled: !photosHref,
    },
    {
      key: "settings",
      href: "/dashboard/settings",
      label: "Settings",
      icon: Settings,
      match: (p) => p.startsWith("/dashboard/settings"),
      disabled: false,
    },
  ];
}

interface SidebarNavProps extends NavConfig {
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}

export function SidebarNav({ propertyHref, photosHref, onNavigate, variant = "sidebar" }: SidebarNavProps) {
  const pathname = usePathname();
  const items = buildNav({ propertyHref, photosHref });
  const isSheet = variant === "sheet";

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Primary navigation">
      {items.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={item.disabled}
            onClick={item.disabled ? (e) => e.preventDefault() : onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isSheet ? "min-h-11" : "",
              isActive
                ? "bg-brand-teal/10 text-brand-teal"
                : "text-brand-muted hover:bg-brand-medium-gray hover:text-brand-black",
              item.disabled && "pointer-events-none opacity-50",
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-teal"
              />
            ) : null}
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-brand-teal" : "text-brand-muted group-hover:text-brand-black",
              )}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
