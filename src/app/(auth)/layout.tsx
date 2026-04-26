import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-crema">
      <header className="border-b border-rule bg-paper">
        <div className="container flex h-16 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-medium tracking-tight text-text"
          >
            NoComiss
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </main>
  );
}
