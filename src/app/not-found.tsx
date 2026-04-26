import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-crema px-4">
      <div className="w-full max-w-md space-y-5 border border-rule-strong bg-ivory p-10 text-center">
        <div className="eyebrow eyebrow-coral">404</div>
        <h1 className="font-serif text-3xl font-medium text-text">
          <span className="italic">Page not found.</span>
        </h1>
        <p className="text-sm text-text-2">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Button asChild>
          <Link href="/">
            Go home <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
