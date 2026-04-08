"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  CalendarDays,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/listings", label: "Mis inmuebles", icon: Home },
  { href: "/dashboard/visitas", label: "Visitas", icon: CalendarDays },
  { href: "/dashboard/negociaciones", label: "Negociaciones", icon: Handshake },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

interface SidebarProps {
  user: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = user.full_name ?? user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex flex-col h-full w-60 border-r border-border bg-white">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/" className="font-bold text-xl">
          <span className="text-primary">No</span>Comiss
        </Link>
      </div>

      {/* New listing CTA */}
      <div className="px-4 py-3 border-b border-border">
        <Link
          href="/dashboard/listings/new"
          className="flex items-center justify-center gap-2 h-9 w-full rounded-[8px] bg-primary text-white text-sm font-medium hover:bg-[#38c98d] active:bg-[#33b880] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo inmueble
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors duration-150",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-surface transition-colors cursor-pointer">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-[8px] text-sm text-gray-500 hover:bg-surface hover:text-foreground transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {signingOut ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
