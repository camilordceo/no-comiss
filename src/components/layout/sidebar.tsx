import Link from "next/link";
import { SidebarNav } from "./nav-items";
import { UserCard } from "./user-card";

interface SidebarProps {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export function Sidebar({ email, name, avatarUrl }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface-2 lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-white"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-green text-white">
            R
          </span>
          Rentmies
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav />
      </div>
      <UserCard email={email} name={name} avatarUrl={avatarUrl} />
    </aside>
  );
}
