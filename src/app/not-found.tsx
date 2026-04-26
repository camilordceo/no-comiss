import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-1 px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface-2 p-8 text-center">
        <div className="text-6xl font-bold tracking-tight text-brand-green">404</div>
        <h1 className="text-xl font-semibold text-white">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <Button asChild>
          <Link href="/dashboard">
            Ir al panel <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
