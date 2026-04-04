import Link from "next/link";

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 sm:px-6 lg:px-8 h-14 flex items-center">
        <Link href="/" className="font-bold text-foreground text-lg tracking-tight">
          No<span className="text-primary">Comiss</span>
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
