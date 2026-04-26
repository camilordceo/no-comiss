import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireDashboardSession } from "@/lib/hooks/use-session";
import { ListingForm } from "./listing-form";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const session = await requireDashboardSession();

  if (!session.profile.empresa_id) {
    redirect("/dashboard");
  }

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

      <ListingForm empresaId={session.profile.empresa_id} />
    </div>
  );
}
