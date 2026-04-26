"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    key: "inmuebles",
    href: "/dashboard/property/new",
    label: "Nuevo inmueble",
    icon: Plus,
    match: (p) => p.startsWith("/dashboard/property/new"),
  },
  {
    key: "settings",
    href: "/dashboard/settings",
    label: "Configuración",
    icon: Settings,
    match: (p) => p.startsWith("/dashboard/settings"),
  },
];

interface SidebarNavProps {
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}

export function SidebarNav({ onNavigate, variant = "sidebar" }: SidebarNavProps) {
  const pathname = usePathname();
  const isSheet = variant === "sheet";

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navegación principal">
      {NAV.map((item) => {
        const isActive = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-150",
              isSheet ? "min-h-11" : "",
              isActive
                ? "bg-brand-green/15 text-brand-green"
                : "text-muted-foreground hover:bg-surface-3 hover:text-white",
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-green"
              />
            ) : null}
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNavLinks() {
  const pathname = usePathname();
  return (
    <ul className="grid grid-cols-3">
      {NAV.map(({ label, href, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                active ? "text-brand-green" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label === "Nuevo inmueble" ? "Nuevo" : label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export const _NAV_FOR_TYPING: typeof NAV = NAV;
