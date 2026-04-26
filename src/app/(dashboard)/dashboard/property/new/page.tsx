import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { Button } from "@/components/ui/button";
import { ListingForm } from "./listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const session = await requireDashboardSession();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver
        </Link>
        <div className="mt-3">
          <div className="label-section mb-2">Nuevo inmueble</div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Publica tu inmueble.
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Llena los datos, sube unas fotos buenas y el agente de IA empieza a pautarlo.
          </p>
        </div>
      </div>

      {session.profile.empresa_id ? (
        <ListingForm empresaId={session.profile.empresa_id} />
      ) : (
        <div className="space-y-4 rounded-xl border border-warning/40 bg-warning/10 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-white">
                Tu cuenta aún no está asociada a una empresa
              </h2>
              <p className="text-sm text-muted-foreground">
                Esto suele pasar cuando faltan los triggers/policies en la base de datos. El
                self-heal automático del app intentó crear la empresa pero no pudo. Verifica:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
                <li>
                  Corre <code className="rounded-sm bg-surface-3 px-1.5 py-0.5">supabase/fix-bootstrap-final.sql</code>{" "}
                  en el SQL Editor de Supabase.
                </li>
                <li>
                  Revisa el log abajo en la consola del servidor por mensajes
                  <code className="ml-1 rounded-sm bg-surface-3 px-1.5 py-0.5">session.bootstrap_*_failed</code>.
                </li>
                <li>Después refresca esta página.</li>
              </ul>
              <div className="pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">Volver al inicio</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
