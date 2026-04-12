/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Home, Users, CalendarDays, Video,
  MessageCircle, BarChart3, Sparkles, Settings, LogOut, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard",                label: "Overview",    icon: LayoutDashboard, exact: true },
  { href: "/dashboard/listings",       label: "My Listing",  icon: Home },
  { href: "/dashboard/leads",          label: "Leads",       icon: Users },
  { href: "/dashboard/visitas",        label: "Showings",    icon: CalendarDays },
  { href: "/dashboard/content",        label: "Content",     icon: Video },
  { href: "/dashboard/negociaciones",  label: "Offers",      icon: MessageCircle },
  { href: "/dashboard/analytics",      label: "Analytics",   icon: BarChart3 },
];

const bottomItems = [
  { href: "/dashboard/ai-advisor", label: "AI Advisor", icon: Sparkles, comingSoon: true },
  { href: "/dashboard/settings",   label: "Settings",   icon: Settings },
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
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

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
          className="flex items-center justify-center gap-2 h-9 w-full rounded-[8px] bg-primary text-white text-sm font-medium hover:bg-[#38c98d] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          List my home
        </Link>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors duration-150",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-[#f0f0f0] hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-border space-y-0.5">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors duration-150",
                  active && !item.comingSoon
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-[#f0f0f0] hover:text-foreground",
                  item.comingSoon && "cursor-default"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
                {item.comingSoon && (
                  <span className="ml-auto text-[9px] font-semibold text-gray-400 bg-[#f0f0f0] px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 pb-4">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] hover:bg-[#f0f0f0] transition-colors">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-[8px] text-sm text-gray-500 hover:bg-[#f0f0f0] hover:text-foreground transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
