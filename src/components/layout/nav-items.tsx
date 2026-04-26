"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Camera,
  Home,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
}

const NAV_PRIMARY: NavItem[] = [
  {
    key: "overview",
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    key: "listings",
    href: "/dashboard/property/new",
    label: "New listing",
    icon: Home,
    match: (p) => p.startsWith("/dashboard/property"),
  },
];

const NAV_SECONDARY: NavItem[] = [
  {
    key: "results",
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

interface SidebarNavProps {
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}

function NavLink({
  item,
  active,
  onNavigate,
  isSheet,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  isSheet: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3",
        "font-mono text-[11px] font-semibold uppercase tracking-[0.14em]",
        "transition-colors duration-180",
        isSheet ? "min-h-12" : "",
        active
          ? "border-l-2 border-coral bg-crema-2 text-text"
          : "border-l-2 border-transparent text-text-3 hover:bg-crema-2/60 hover:text-text",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {item.label}
    </Link>
  );
}

export function SidebarNav({ onNavigate, variant = "sidebar" }: SidebarNavProps) {
  const pathname = usePathname();
  const isSheet = variant === "sheet";

  return (
    <nav className="flex flex-col gap-3" aria-label="Primary navigation">
      <div>
        <div className="px-4 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Workspace
        </div>
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={item.match(pathname)}
            onNavigate={onNavigate}
            isSheet={isSheet}
          />
        ))}
      </div>
      <div>
        <div className="px-4 pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Account
        </div>
        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={item.match(pathname)}
            onNavigate={onNavigate}
            isSheet={isSheet}
          />
        ))}
      </div>
    </nav>
  );
}

const NAV_BOTTOM: NavItem[] = [
  ...NAV_PRIMARY,
  {
    key: "settings",
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

export function BottomNavLinks() {
  const pathname = usePathname();
  return (
    <ul className="grid grid-cols-3">
      {NAV_BOTTOM.map(({ label, href, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2",
                "font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
                "transition-colors duration-180",
                active
                  ? "text-coral border-t-2 border-coral"
                  : "text-text-3 border-t-2 border-transparent",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label === "New listing" ? "New" : label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export const _NAV_FOR_TYPING: typeof NAV_PRIMARY = NAV_PRIMARY;
