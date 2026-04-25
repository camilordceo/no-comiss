import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg-alt px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-brand-light-gray bg-white p-8 text-center shadow-sm">
        <div className="text-6xl font-semibold tracking-tight text-brand-teal">404</div>
        <h1 className="text-xl font-medium text-brand-black">Page not found</h1>
        <p className="text-sm text-brand-muted">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Button asChild>
          <Link href="/dashboard">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
