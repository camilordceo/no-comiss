import Link from "next/link";
import { SidebarNav } from "./nav-items";
import { UserCard } from "./user-card";

interface SidebarProps {
  email: string;
  name: string;
  avatarUrl: string | null;
  empresaName?: string | null;
}

export function Sidebar({ email, name, avatarUrl, empresaName }: SidebarProps) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-rule-strong bg-ivory lg:flex">
      <div className="flex h-16 items-center border-b border-rule px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-serif text-lg font-medium tracking-tight text-text"
        >
          NoComiss
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
        </Link>
      </div>

      {/* Workspace card */}
      <div className="border-b border-rule px-4 py-4">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
          Terminal
        </div>
        <div className="mt-1 truncate font-serif text-base font-medium text-text">
          {empresaName ?? "Your workspace"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
      <UserCard email={email} name={name} avatarUrl={avatarUrl} />
    </aside>
  );
}
