import Link from "next/link";
import { SidebarNav } from "./nav-items";
import { UserCard } from "./user-card";

interface SidebarProps {
  propertyHref?: string | null;
  photosHref?: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function Sidebar({ propertyHref = null, photosHref = null, email, name, avatarUrl }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-brand-light-gray bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-brand-light-gray px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-brand-black">
          No<span className="text-brand-teal">Comiss</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav propertyHref={propertyHref} photosHref={photosHref} />
      </div>
      <UserCard email={email} name={name} avatarUrl={avatarUrl} />
    </aside>
  );
}
