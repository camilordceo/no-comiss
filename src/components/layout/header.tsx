"use client";

import { useState } from "react";
import Link from "next/link";
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
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function Header({ email, name, avatarUrl }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-2/80 px-4 backdrop-blur",
        "lg:hidden",
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-base font-bold tracking-tight text-white"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-green text-white">
          R
        </span>
        Rentmies
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Abrir menú"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-3 text-foreground",
            "transition-all duration-150 hover:border-brand-green hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
          )}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </SheetTrigger>
        <SheetContent side="right" className="flex w-72 flex-col gap-0 p-0">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pb-4">
            <SidebarNav variant="sheet" onNavigate={() => setOpen(false)} />
          </div>
          <UserCard email={email} name={name} avatarUrl={avatarUrl} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
