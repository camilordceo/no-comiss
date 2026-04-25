"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BottomNavProps {
  propertyHref?: string | null;
  photosHref?: string | null;
}

export function BottomNav({ propertyHref, photosHref }: BottomNavProps) {
  const pathname = usePathname();
  const items = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard, active: pathname === "/dashboard" },
    {
      label: "Property",
      href: propertyHref ?? "/dashboard/property/new",
      icon: Home,
      active:
        pathname.startsWith("/dashboard/property") && !pathname.includes("/photos"),
      disabled: !propertyHref,
    },
    {
      label: "Photos",
      href: photosHref ?? "/dashboard/property/new",
      icon: ImageIcon,
      active: pathname.includes("/photos"),
      disabled: !photosHref,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ];
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-light-gray bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ label, href, icon: Icon, active, disabled }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-disabled={disabled}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "text-brand-teal" : "text-brand-muted",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
