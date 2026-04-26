import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-surface-1">
      <header className="border-b border-border bg-surface-2/60 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-green text-white">
              R
            </span>
            Rentmies
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md page-enter">{children}</div>
      </div>
    </main>
  );
}
