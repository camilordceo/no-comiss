import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-brand-bg-alt">
      <header className="border-b border-brand-light-gray bg-white">
        <div className="container flex h-16 items-center">
          <Link href="/" className="text-lg font-semibold tracking-tight text-brand-black">
            No<span className="text-brand-teal">Comiss</span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md page-enter">{children}</div>
      </div>
    </main>
  );
}
