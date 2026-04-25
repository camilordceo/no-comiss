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
  propertyHref: string | null;
  photosHref: string | null;
}

export function Header({ email, name, avatarUrl, propertyHref, photosHref }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-brand-light-gray bg-white/90 px-4 backdrop-blur",
        "lg:hidden",
      )}
    >
      <Link href="/dashboard" className="text-base font-semibold tracking-tight text-brand-black">
        No<span className="text-brand-teal">Comiss</span>
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open menu"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md border border-brand-light-gray bg-white text-brand-black",
            "transition-all duration-200 hover:border-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2",
          )}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </SheetTrigger>
        <SheetContent side="right" className="flex w-72 flex-col gap-0 p-0">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pb-4">
            <SidebarNav
              propertyHref={propertyHref}
              photosHref={photosHref}
              variant="sheet"
              onNavigate={() => setOpen(false)}
            />
          </div>
          <UserCard email={email} name={name} avatarUrl={avatarUrl} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
